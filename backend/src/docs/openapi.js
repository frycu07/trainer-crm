// dokumentacja OpenAPI 3.0 - serwowana przez Swagger UI pod /api/docs
// JS zamiast JSON tylko po to, zeby nie przepisywac tych samych blokow odpowiedzi;
// wynikowy obiekt to zwykly dokument OpenAPI (format bledu zdefiniowany raz, wszedzie $ref)

const ref = name => ({ $ref: `#/components/schemas/${name}` });
const json = schema => ({ "application/json": { schema } });
const ok = (description, schema) => ({ description, content: json(schema) });
const err = name => ({ $ref: `#/components/responses/${name}` });
const idParam = what => ({
  name: "id", in: "path", required: true, description: `${what} ID`,
  schema: { type: "integer", minimum: 1 }
});
const body = schema => ({ required: true, content: json(schema) });
const query = (name, schema, description, required = false) => ({ name, in: "query", required, description, schema });

const dateTime = { type: "string", format: "date-time" };
const pageParams = [
  query("page", { type: "integer", minimum: 1, default: 1 }, "Numer strony"),
  query("limit", { type: "integer", minimum: 1, maximum: 50, default: 10 }, "Liczba wynikow na strone (max 50)")
];

function errorResponse(description, code, message, details = []) {
  return {
    description,
    content: {
      "application/json": {
        schema: ref("Error"),
        example: { error: { code, message, details } }
      }
    }
  };
}

// wspolne odpowiedzi bledow dla endpointow z tokenem
const auth = { 401: err("Unauthorized") };

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Trainer CRM API",
    version: "1.0.0",
    description:
      "System dla trenera personalnego: klienci, pakiety treningow, planowanie treningow, powiadomienia (ZTPAI). " +
      "Wszystkie endpointy poza /health i /auth/login wymagaja naglowka `Authorization: Bearer <token>` - " +
      "token z POST /auth/login, potem przycisk **Authorize**.\n\n" +
      "Role: **ADMIN** (uzytkownicy, wszyscy klienci, usuwanie treningow) i **TRAINER** (tylko swoi klienci, pakiety i treningi)."
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Health", description: "Sprawdzenie, czy API dziala" },
    { name: "Auth", description: "Logowanie i biezacy uzytkownik" },
    { name: "Users", description: "Zarzadzanie kontami - tylko ADMIN" },
    { name: "Clients", description: "TRAINER - tylko wlasni klienci, ADMIN - wszyscy" },
    { name: "Packages", description: "Pakiety treningow klienta (dostep przez klienta)" },
    { name: "Sessions", description: "Treningi - reguly R1-R5, usuwanie tylko ADMIN" },
    { name: "Notifications", description: "Wlasne powiadomienia zalogowanego uzytkownika" }
  ],
  // domyslnie kazdy endpoint wymaga tokenu, publiczne nadpisuja to przez security: []
  security: [{ bearerAuth: [] }],

  paths: {
    "/health": {
      get: {
        tags: ["Health"], summary: "Stan API", security: [],
        responses: { 200: ok("API dziala", { type: "object", properties: { status: { type: "string", example: "ok" } } }) }
      }
    },

    "/auth/login": {
      post: {
        tags: ["Auth"], summary: "Logowanie - zwraca JWT", security: [],
        requestBody: body(ref("LoginRequest")),
        responses: {
          200: ok("Token i dane uzytkownika", ref("LoginResponse")),
          400: err("BadRequest"),
          401: { ...err("Unauthorized"), description: "INVALID_CREDENTIALS - zly email albo zle haslo (ta sama odpowiedz)" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"], summary: "Dane zalogowanego uzytkownika",
        responses: { 200: ok("Zalogowany uzytkownik", ref("User")), ...auth }
      }
    },

    "/users": {
      get: {
        tags: ["Users"], summary: "Lista uzytkownikow (ADMIN)",
        responses: { 200: ok("Uzytkownicy", { type: "array", items: ref("User") }), ...auth, 403: err("Forbidden") }
      },
      post: {
        tags: ["Users"], summary: "Nowy uzytkownik (ADMIN)",
        requestBody: body(ref("UserCreate")),
        responses: {
          201: ok("Utworzony uzytkownik", ref("User")),
          400: err("BadRequest"), ...auth, 403: err("Forbidden"),
          409: { ...err("Conflict"), description: "EMAIL_TAKEN - email jest juz zajety" }
        }
      }
    },
    "/users/{id}": {
      parameters: [idParam("User")],
      delete: {
        tags: ["Users"], summary: "Usuniecie uzytkownika (ADMIN)",
        responses: {
          204: { description: "Usunieto" },
          400: err("BadRequest"), ...auth, 403: err("Forbidden"), 404: err("NotFound"),
          409: { ...err("Conflict"), description: "CANNOT_DELETE_SELF albo uzytkownik ma klientow / treningi (FOREIGN_KEY_VIOLATION)" }
        }
      }
    },

    "/clients": {
      get: {
        tags: ["Clients"], summary: "Lista klientow z pagination i wyszukiwaniem",
        description: "TRAINER widzi tylko swoich klientow, ADMIN wszystkich.",
        parameters: [
          ...pageParams,
          query("q", { type: "string", maxLength: 100 }, "Szukaj po imieniu, nazwisku i emailu (bez rozroznienia wielkosci liter)")
        ],
        responses: { 200: ok("Strona klientow", ref("ClientPage")), 400: err("BadRequest"), ...auth }
      },
      post: {
        tags: ["Clients"], summary: "Nowy klient (przypisany do zalogowanego trenera)",
        requestBody: body(ref("ClientInput")),
        responses: { 201: ok("Utworzony klient", ref("Client")), 400: err("BadRequest"), ...auth }
      }
    },
    "/clients/{id}": {
      parameters: [idParam("Client")],
      get: {
        tags: ["Clients"], summary: "Jeden klient",
        responses: {
          200: ok("Klient", ref("Client")), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Nie istnieje albo nalezy do innego trenera" }
        }
      },
      put: {
        tags: ["Clients"], summary: "Pelna edycja klienta",
        requestBody: body(ref("ClientInput")),
        responses: {
          200: ok("Zmieniony klient", ref("Client")), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Nie istnieje albo nalezy do innego trenera" }
        }
      },
      delete: {
        tags: ["Clients"], summary: "Usuniecie klienta (R6)",
        responses: {
          204: { description: "Usunieto (razem z pakietami i treningami klienta)" },
          400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Nie istnieje albo nalezy do innego trenera" },
          409: { ...err("Conflict"), description: "CLIENT_HAS_SCHEDULED_SESSIONS - klient ma zaplanowane treningi" }
        }
      }
    },

    "/packages": {
      get: {
        tags: ["Packages"], summary: "Pakiety klienta",
        parameters: [query("clientId", { type: "integer", minimum: 1 }, "ID klienta", true)],
        responses: {
          200: ok("Pakiety", { type: "array", items: ref("Package") }), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Klient nie istnieje albo nalezy do innego trenera" }
        }
      },
      post: {
        tags: ["Packages"], summary: "Nowy pakiet dla klienta",
        requestBody: body(ref("PackageCreate")),
        responses: {
          201: ok("Utworzony pakiet", ref("Package")), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Klient nie istnieje albo nalezy do innego trenera" }
        }
      }
    },
    "/packages/{id}": {
      parameters: [idParam("Package")],
      put: {
        tags: ["Packages"], summary: "Edycja pakietu",
        requestBody: body(ref("PackageUpdate")),
        responses: {
          200: ok("Zmieniony pakiet", ref("Package")), 400: err("BadRequest"), ...auth, 404: err("NotFound"),
          409: { ...err("Conflict"), description: "PACKAGE_TOTAL_BELOW_USED - totalSessions mniejsze niz usedSessions" }
        }
      },
      delete: {
        tags: ["Packages"], summary: "Usuniecie pakietu",
        responses: {
          204: { description: "Usunieto" }, 400: err("BadRequest"), ...auth, 404: err("NotFound"),
          409: { ...err("Conflict"), description: "FOREIGN_KEY_VIOLATION - pakiet ma treningi" }
        }
      }
    },

    "/sessions": {
      get: {
        tags: ["Sessions"], summary: "Lista treningow z filtrami i pagination (sortowanie po starcie rosnaco)",
        description: "TRAINER widzi tylko swoje treningi, ADMIN wszystkie.",
        parameters: [
          ...pageParams,
          query("status", { type: "string", enum: ["SCHEDULED", "COMPLETED", "CANCELLED"] }, "Status treningu"),
          query("clientId", { type: "integer", minimum: 1 }, "Tylko treningi tego klienta"),
          query("from", dateTime, "Treningi rozpoczete od tej chwili (wlacznie)"),
          query("to", dateTime, "Treningi rozpoczete przed ta chwila (wylacznie)")
        ],
        responses: { 200: ok("Strona treningow", ref("SessionPage")), 400: err("BadRequest"), ...auth }
      },
      post: {
        tags: ["Sessions"], summary: "Zaplanowanie treningu (R1, R2, R3)",
        description:
          "Rezerwuje jedno wejscie z pakietu klienta (ten o najwczesniejszym terminie waznosci). " +
          "Termin w przeszlosci i czas poza 30-180 minut daja 400.",
        requestBody: body(ref("SessionCreate")),
        responses: {
          201: ok("Zaplanowany trening", ref("Session")), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Klient nie istnieje albo nalezy do innego trenera" },
          409: { ...err("Conflict"), description: "NO_ACTIVE_PACKAGE (R1) albo TRAINER_NOT_AVAILABLE (R2)" }
        }
      }
    },
    "/sessions/{id}": {
      parameters: [idParam("Session")],
      get: {
        tags: ["Sessions"], summary: "Jeden trening",
        responses: { 200: ok("Trening", ref("Session")), 400: err("BadRequest"), ...auth, 404: err("NotFound") }
      },
      patch: {
        tags: ["Sessions"], summary: "Zmiana notatki treningu",
        requestBody: body(ref("SessionNotes")),
        responses: { 200: ok("Zmieniony trening", ref("Session")), 400: err("BadRequest"), ...auth, 404: err("NotFound") }
      },
      delete: {
        tags: ["Sessions"], summary: "Usuniecie treningu (tylko ADMIN, tylko gdy nie jest SCHEDULED)",
        responses: {
          204: { description: "Usunieto" }, 400: err("BadRequest"), ...auth, 403: err("Forbidden"), 404: err("NotFound"),
          409: { ...err("Conflict"), description: "SESSION_STILL_SCHEDULED - trening jest jeszcze zaplanowany" }
        }
      }
    },
    "/sessions/{id}/complete": {
      parameters: [idParam("Session")],
      patch: {
        tags: ["Sessions"], summary: "Zakonczenie treningu (SCHEDULED -> COMPLETED)",
        responses: {
          200: ok("Zakonczony trening", ref("Session")), 400: err("BadRequest"), ...auth, 404: err("NotFound"),
          409: { ...err("Conflict"), description: "INVALID_STATUS_TRANSITION - trening nie jest SCHEDULED" }
        }
      }
    },
    "/sessions/{id}/cancel": {
      parameters: [idParam("Session")],
      patch: {
        tags: ["Sessions"], summary: "Odwolanie treningu (R4, R5) - zwraca wejscie do pakietu",
        responses: {
          200: ok("Odwolany trening", ref("Session")), 400: err("BadRequest"), ...auth, 404: err("NotFound"),
          409: { ...err("Conflict"), description: "INVALID_STATUS_TRANSITION albo CANCELLATION_TOO_LATE (mniej niz 24 h do startu)" }
        }
      }
    },

    "/notifications": {
      get: {
        tags: ["Notifications"], summary: "Wlasne powiadomienia (najnowsze pierwsze, max 50)",
        responses: { 200: ok("Powiadomienia", { type: "array", items: ref("Notification") }), ...auth }
      }
    },
    "/notifications/{id}/read": {
      parameters: [idParam("Notification")],
      patch: {
        tags: ["Notifications"], summary: "Oznaczenie powiadomienia jako przeczytane",
        responses: {
          200: ok("Powiadomienie", ref("Notification")), 400: err("BadRequest"), ...auth,
          404: { ...err("NotFound"), description: "Nie istnieje albo nalezy do innego uzytkownika" }
        }
      }
    }
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },

    // kazda odpowiedz bledu wskazuje ten sam schemat Error (przez $ref), rozni sie tylko przykladem
    responses: {
      BadRequest: errorResponse("VALIDATION_ERROR / INVALID_JSON - bledne dane wejsciowe", "VALIDATION_ERROR", "Validation failed",
        [{ location: "body", field: "firstName", message: "Too small: expected string to have >=1 characters" }]),
      Unauthorized: errorResponse("Brak tokenu, zly token albo wygasl (UNAUTHORIZED / INVALID_TOKEN / TOKEN_EXPIRED)",
        "UNAUTHORIZED", "Authentication required"),
      Forbidden: errorResponse("FORBIDDEN - zalogowany, ale bez wymaganej roli", "FORBIDDEN", "Requires role: ADMIN"),
      NotFound: errorResponse("NOT_FOUND - zasob nie istnieje (albo nalezy do kogos innego)", "NOT_FOUND", "Client not found"),
      Conflict: errorResponse("Konflikt z regula biznesowa albo constraintem bazy", "NO_ACTIVE_PACKAGE", "Client has no active package")
    },

    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "details"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Validation failed" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    location: { type: "string", enum: ["params", "query", "body"] },
                    field: { type: "string", example: "firstName" },
                    message: { type: "string", example: "Too small: expected string to have >=1 characters" }
                  }
                }
              }
            }
          }
        }
      },

      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 }, limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 37 }, totalPages: { type: "integer", example: 4 }
        }
      },

      LoginRequest: {
        type: "object", required: ["email", "password"], additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "admin@trainer-crm.local" },
          password: { type: "string" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: ref("User")
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "anna.trener@example.com" },
          fullName: { type: "string", example: "Anna Trener" },
          role: { type: "string", enum: ["ADMIN", "TRAINER"] },
          createdAt: dateTime
        }
      },
      UserCreate: {
        type: "object", required: ["email", "password", "fullName", "role"], additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "anna.trener@example.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "bezpieczne-haslo" },
          fullName: { type: "string", minLength: 1, maxLength: 100, example: "Anna Trener" },
          role: { type: "string", enum: ["ADMIN", "TRAINER"] }
        }
      },

      Client: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          trainerId: { type: "integer", example: 2 },
          firstName: { type: "string", example: "Jan" },
          lastName: { type: "string", example: "Kowalski" },
          email: { type: "string", format: "email", nullable: true },
          phone: { type: "string", nullable: true, example: "500600700" },
          goal: { type: "string", nullable: true, example: "Redukcja wagi" },
          createdAt: dateTime
        }
      },
      ClientInput: {
        type: "object", required: ["firstName", "lastName"], additionalProperties: false,
        description: "trainerId pochodzi z tokenu - podanie go w body daje 400",
        properties: {
          firstName: { type: "string", minLength: 1, maxLength: 50, example: "Jan" },
          lastName: { type: "string", minLength: 1, maxLength: 50, example: "Kowalski" },
          email: { type: "string", format: "email", maxLength: 255 },
          phone: { type: "string", maxLength: 20, example: "500600700" },
          goal: { type: "string", maxLength: 500, example: "Redukcja wagi" }
        }
      },
      ClientPage: {
        type: "object",
        properties: { data: { type: "array", items: ref("Client") }, pagination: ref("Pagination") }
      },

      Package: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          clientId: { type: "integer", example: 1 },
          name: { type: "string", example: "Pakiet 10 treningow" },
          totalSessions: { type: "integer", example: 10 },
          usedSessions: { type: "integer", example: 3 },
          remainingSessions: { type: "integer", example: 7 },
          price: { type: "number", example: 600.5 },
          validUntil: { type: "string", format: "date", example: "2027-03-31" },
          createdAt: dateTime
        }
      },
      PackageCreate: {
        type: "object", required: ["clientId", "name", "totalSessions", "price", "validUntil"], additionalProperties: false,
        properties: {
          clientId: { type: "integer", minimum: 1, example: 1 },
          name: { type: "string", minLength: 1, maxLength: 100, example: "Pakiet 10 treningow" },
          totalSessions: { type: "integer", minimum: 1, maximum: 100, example: 10 },
          price: { type: "number", minimum: 0, example: 600.5 },
          validUntil: { type: "string", format: "date", example: "2027-03-31" }
        }
      },
      PackageUpdate: {
        type: "object", required: ["name", "totalSessions", "price", "validUntil"], additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          totalSessions: { type: "integer", minimum: 1, maximum: 100 },
          price: { type: "number", minimum: 0 },
          validUntil: { type: "string", format: "date" }
        }
      },

      Session: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          client: {
            type: "object",
            properties: { id: { type: "integer" }, firstName: { type: "string" }, lastName: { type: "string" } }
          },
          trainerId: { type: "integer", example: 2 },
          packageId: { type: "integer", example: 1 },
          startsAt: dateTime,
          endsAt: dateTime,
          durationMinutes: { type: "integer", example: 60 },
          status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "CANCELLED"] },
          notes: { type: "string", nullable: true },
          createdAt: dateTime
        }
      },
      SessionCreate: {
        type: "object", required: ["clientId", "startsAt", "durationMinutes"], additionalProperties: false,
        properties: {
          clientId: { type: "integer", minimum: 1, example: 1 },
          startsAt: { ...dateTime, example: "2026-12-01T10:00:00.000Z" },
          durationMinutes: { type: "integer", minimum: 30, maximum: 180, example: 60 },
          notes: { type: "string", maxLength: 1000 }
        }
      },
      SessionNotes: {
        type: "object", required: ["notes"], additionalProperties: false,
        properties: { notes: { type: "string", maxLength: 1000, example: "Rozgrzewka i nogi" } }
      },
      SessionPage: {
        type: "object",
        properties: { data: { type: "array", items: ref("Session") }, pagination: ref("Pagination") }
      },

      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          message: { type: "string", example: "Zaplanowano trening: Jan Kowalski, 01.12.2026, 11:00" },
          isRead: { type: "boolean" },
          createdAt: dateTime
        }
      }
    }
  }
};

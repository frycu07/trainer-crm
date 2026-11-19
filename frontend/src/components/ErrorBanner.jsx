// pokazuje blad z API: komunikat i liste szczegolow (np. bledy walidacji)
export default function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <strong>{error.message}</strong>
      {error.details && error.details.length > 0 && (
        <ul>
          {error.details.map((detail, index) => (
            <li key={index}>
              {detail.field ? `${detail.field}: ` : ""}
              {detail.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

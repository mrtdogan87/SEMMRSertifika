"use client";

export function LoginForm() {
  return (
    <form
      className="field-stack"
      method="POST"
      action="/api/auth/login"
    >
      <div className="field">
        <label htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" placeholder="admin@semmrjournal.com" required />
      </div>
      <div className="field">
        <label htmlFor="password">Parola</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button className="button primary" type="submit">
        Giriş Yap
      </button>
    </form>
  );
}

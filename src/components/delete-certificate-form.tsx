"use client";

type DeleteCertificateFormProps = {
  action: string;
  confirmMessage?: string;
};

export function DeleteCertificateForm({ action, confirmMessage }: DeleteCertificateFormProps) {
  return (
    <form
      className="inline-form"
      action={action}
      method="POST"
      onSubmit={(event) => {
        const ok = window.confirm(confirmMessage ?? "Bu sertifika kaydını silmek istediğinize emin misiniz?");
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <button className="button danger" type="submit">
        Sil
      </button>
    </form>
  );
}

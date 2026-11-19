"use client";

export function DeleteButton() {
  return (
    <button
      type="submit"
      className="adm-btn border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
      onClick={(event) => {
        if (!confirm("Delete this product permanently? Past orders keep their item names.")) {
          event.preventDefault();
        }
      }}
    >
      Delete product
    </button>
  );
}

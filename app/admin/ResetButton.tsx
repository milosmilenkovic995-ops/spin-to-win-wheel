"use client";

export default function ResetButton() {
  return (
    <form
      method="POST"
      action="/api/admin/reset"
      onSubmit={(e) => {
        if (
          !confirm(
            "Reset ALL submissions and events?\n\nThis permanently deletes every row in the database. There is NO undo.\n\nUse this only before going live with real customers, or when wiping test data."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:border-red-400 hover:bg-red-100"
      >
        Reset all data
      </button>
    </form>
  );
}

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { toggleUserStatus } from "./actions";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Usuarios</h1>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Rol</th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-left">Acción</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-800"
                >
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.role}</td>
                  <td className="p-4">{user.status}</td>
                  <td className="p-4">
                    <form
                      action={async () => {
                        "use server";
                        await toggleUserStatus(user.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs"
                      >
                        {user.status === "ACTIVE"
                          ? "Suspender"
                          : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
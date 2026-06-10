"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Download, Upload } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryIconSelect } from "@/components/category-icon-select";
import type { BootstrapData, CurrentUser } from "@/lib/types";

type CategoryEdit = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type LocationEdit = {
  id: string;
  name: string;
};

type UserEdit = {
  id: string;
  name: string;
  contact: string;
  email: string;
};

export function SettingsScreen({ bootstrap, user }: { bootstrap: BootstrapData; user: CurrentUser }) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("Package");
  const [categoryColor, setCategoryColor] = useState("#0f766e");
  const [locationName, setLocationName] = useState("");
  const [userName, setUserName] = useState("");
  const [userContact, setUserContact] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryEdit | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationEdit | null>(null);
  const [editingUser, setEditingUser] = useState<UserEdit | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const canReset = user.role === "ADMIN" && confirmation === "RESET";
  const canRestore = user.role === "ADMIN" && restoreConfirmation === "RESTORE" && Boolean(restoreFile);

  async function addCategory() {
    if (user.role !== "ADMIN") return;
    setCategorySaving(true);
    setCategoryMessage("");
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName, icon: categoryIcon, color: categoryColor })
    });
    const data = await response.json();
    setCategorySaving(false);

    if (!response.ok) {
      setCategoryMessage(typeof data.error === "string" ? data.error : "Unable to add category.");
      return;
    }

    window.location.reload();
  }

  async function deleteCategory(id: string) {
    if (user.role !== "ADMIN") return;
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setCategoryMessage(typeof data.error === "string" ? data.error : "Unable to delete category.");
      return;
    }
    window.location.reload();
  }

  async function updateCategory() {
    if (user.role !== "ADMIN" || !editingCategory) return;
    const response = await fetch(`/api/categories/${editingCategory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCategory)
    });
    if (!response.ok) {
      const data = await response.json();
      setCategoryMessage(typeof data.error === "string" ? data.error : "Unable to update category.");
      return;
    }
    window.location.reload();
  }

  async function addLocation() {
    if (user.role !== "ADMIN") return;
    setLocationSaving(true);
    setLocationMessage("");
    const response = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: locationName })
    });
    const data = await response.json();
    setLocationSaving(false);

    if (!response.ok) {
      setLocationMessage(typeof data.error === "string" ? data.error : "Unable to add location.");
      return;
    }

    window.location.reload();
  }

  async function deleteLocation(id: string) {
    if (user.role !== "ADMIN") return;
    const response = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setLocationMessage(typeof data.error === "string" ? data.error : "Unable to delete location.");
      return;
    }
    window.location.reload();
  }

  async function updateLocation() {
    if (user.role !== "ADMIN" || !editingLocation) return;
    const response = await fetch(`/api/locations/${editingLocation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingLocation)
    });
    if (!response.ok) {
      const data = await response.json();
      setLocationMessage(typeof data.error === "string" ? data.error : "Unable to update location.");
      return;
    }
    window.location.reload();
  }

  async function addUser() {
    if (user.role !== "ADMIN") return;
    setUserSaving(true);
    setUserMessage("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: userName, contact: userContact, email: userEmail })
    });
    const data = await response.json();
    setUserSaving(false);

    if (!response.ok) {
      setUserMessage(typeof data.error === "string" ? data.error : "Unable to add user.");
      return;
    }

    setUserMessage(`User added. Temporary password: ${data.defaultPassword}`);
    setUserName("");
    setUserContact("");
    setUserEmail("");
    window.setTimeout(() => window.location.reload(), 900);
  }

  async function updateUser() {
    if (user.role !== "ADMIN" || !editingUser) return;
    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser)
    });
    if (!response.ok) {
      const data = await response.json();
      setUserMessage(typeof data.error === "string" ? data.error : "Unable to update user.");
      return;
    }
    window.location.reload();
  }

  async function deleteUser(id: string) {
    if (user.role !== "ADMIN") return;
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setUserMessage(typeof data.error === "string" ? data.error : "Unable to delete user.");
      return;
    }
    window.location.reload();
  }

  async function resetSystem() {
    if (!canReset) return;
    setResetting(true);
    setMessage("");
    const response = await fetch("/api/admin/reset", { method: "POST" });
    setResetting(false);

    if (!response.ok) {
      setMessage(response.status === 403 ? "Only admins can reset the system." : "Reset failed.");
      return;
    }

    setMessage("System reset complete. Admin accounts were maintained.");
    setConfirmation("");
    window.location.reload();
  }

  async function downloadBackup() {
    if (user.role !== "ADMIN") return;
    setBackingUp(true);
    setBackupMessage("");
    const response = await fetch("/api/admin/backup");
    setBackingUp(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setBackupMessage(typeof data?.error === "string" ? data.error : "Backup failed.");
      return;
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "mapped-asset-manager-backup.zip";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup downloaded.");
  }

  async function restoreBackup() {
    if (!canRestore || !restoreFile) return;
    setRestoring(true);
    setBackupMessage("");
    const data = new FormData();
    data.set("backup", restoreFile);
    const response = await fetch("/api/admin/restore", { method: "POST", body: data });
    const result = await response.json().catch(() => null);
    setRestoring(false);

    if (!response.ok) {
      setBackupMessage(typeof result?.error === "string" ? result.error : "Restore failed.");
      return;
    }

    setBackupMessage("Restore complete.");
    setRestoreConfirmation("");
    setRestoreFile(null);
    window.location.reload();
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-24 pt-4 md:grid-cols-2 md:pb-8">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <CollapseHeader
          open={categoriesOpen}
          title="Categories"
          subtitle={`${bootstrap.categories.length} configured`}
          onToggle={() => setCategoriesOpen((open) => !open)}
        />
        {categoriesOpen ? (
          <>
            <div className="mt-3 grid gap-2 rounded-md border border-line p-3">
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="New category"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                disabled={user.role !== "ADMIN" || categorySaving}
              />
              <div className="grid grid-cols-[1fr,64px] gap-2">
                <CategoryIconSelect
                  value={categoryIcon}
                  onChange={setCategoryIcon}
                  disabled={user.role !== "ADMIN" || categorySaving}
                />
                <input
                  className="h-10 w-full rounded-md border border-line p-1"
                  type="color"
                  value={categoryColor}
                  onChange={(event) => setCategoryColor(event.target.value)}
                  disabled={user.role !== "ADMIN" || categorySaving}
                />
              </div>
              <button
                className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={user.role !== "ADMIN" || !categoryName.trim() || categorySaving}
                onClick={addCategory}
              >
                {categorySaving ? "Adding..." : "Add category"}
              </button>
              {categoryMessage ? <p className="text-sm text-slate-600">{categoryMessage}</p> : null}
            </div>
            <div className="mt-3 space-y-2">
              {bootstrap.categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-md border border-line p-3">
                  {editingCategory?.id === category.id ? (
                    <div className="grid w-full gap-2">
                      <input
                        className="rounded-md border border-line px-3 py-2 text-sm"
                        value={editingCategory.name}
                        onChange={(event) => setEditingCategory({ ...editingCategory, name: event.target.value })}
                      />
                      <div className="grid grid-cols-[1fr,64px] gap-2">
                        <CategoryIconSelect
                          value={editingCategory.icon}
                          onChange={(icon) => setEditingCategory({ ...editingCategory, icon })}
                        />
                        <input
                          className="h-10 w-full rounded-md border border-line p-1"
                          type="color"
                          value={editingCategory.color}
                          onChange={(event) => setEditingCategory({ ...editingCategory, color: event.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white" type="button" onClick={updateCategory}>
                          Save
                        </button>
                        <button className="rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setEditingCategory(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="inline-flex items-center gap-2 font-medium">
                          <CategoryIcon name={category.icon} color={category.color} size={17} />
                          {category.name}
                        </p>
                        <p className="text-xs text-slate-500">{category._count?.assets || 0} assets</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded" style={{ background: category.color }} />
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN"}
                          onClick={() => setEditingCategory({ id: category.id, name: category.name, icon: category.icon, color: category.color })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN" || Boolean(category._count?.assets)}
                          onClick={() => deleteCategory(category.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <CollapseHeader
          open={locationsOpen}
          title="Locations"
          subtitle={`${bootstrap.locations.length} configured`}
          onToggle={() => setLocationsOpen((open) => !open)}
        />
        {locationsOpen ? (
          <>
            <div className="mt-3 grid gap-2 rounded-md border border-line p-3">
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="New location"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                disabled={user.role !== "ADMIN" || locationSaving}
              />
              <button
                className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={user.role !== "ADMIN" || !locationName.trim() || locationSaving}
                onClick={addLocation}
              >
                {locationSaving ? "Adding..." : "Add location"}
              </button>
              {locationMessage ? <p className="text-sm text-slate-600">{locationMessage}</p> : null}
            </div>
            <div className="mt-3 space-y-2">
              {bootstrap.locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between rounded-md border border-line p-3">
                  {editingLocation?.id === location.id ? (
                    <div className="grid w-full gap-2">
                      <input
                        className="rounded-md border border-line px-3 py-2 text-sm"
                        value={editingLocation.name}
                        onChange={(event) => setEditingLocation({ ...editingLocation, name: event.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white" type="button" onClick={updateLocation}>
                          Save
                        </button>
                        <button className="rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setEditingLocation(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-xs text-slate-500">{location._count?.assets || 0} assets</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN"}
                          onClick={() => setEditingLocation({ id: location.id, name: location.name })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN" || Boolean(location._count?.assets)}
                          onClick={() => deleteLocation(location.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft md:col-span-2">
        <CollapseHeader
          open={usersOpen}
          title="Users"
          subtitle={`${bootstrap.users.length} active`}
          onToggle={() => setUsersOpen((open) => !open)}
        />
        {usersOpen ? (
          <>
            <div className="mt-3 grid gap-2 rounded-md border border-line p-3 md:grid-cols-3">
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="Name"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                disabled={user.role !== "ADMIN" || userSaving}
              />
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="Contact"
                value={userContact}
                onChange={(event) => setUserContact(event.target.value)}
                disabled={user.role !== "ADMIN" || userSaving}
              />
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="Email"
                type="email"
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                disabled={user.role !== "ADMIN" || userSaving}
              />
              <button
                className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-3"
                type="button"
                disabled={user.role !== "ADMIN" || !userName.trim() || !userEmail.trim() || userSaving}
                onClick={addUser}
              >
                {userSaving ? "Adding..." : "Add user"}
              </button>
              {userMessage ? <p className="text-sm text-slate-600 md:col-span-3">{userMessage}</p> : null}
            </div>
            <div className="mt-3 space-y-2">
              {bootstrap.users.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  {editingUser?.id === item.id ? (
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        className="rounded-md border border-line px-3 py-2 text-sm"
                        value={editingUser.name}
                        onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
                      />
                      <input
                        className="rounded-md border border-line px-3 py-2 text-sm"
                        value={editingUser.contact}
                        onChange={(event) => setEditingUser({ ...editingUser, contact: event.target.value })}
                      />
                      <input
                        className="rounded-md border border-line px-3 py-2 text-sm"
                        type="email"
                        value={editingUser.email}
                        onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })}
                      />
                      <button className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white md:col-span-2" type="button" onClick={updateUser}>
                        Save
                      </button>
                      <button className="rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setEditingUser(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {item.name}
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{item.role.toLowerCase()}</span>
                        </p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                        <p className="text-xs text-slate-500">{item.contact || "No contact"} · {item._count?.assigned || 0} assets</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {item._count?.assigned ? (
                          <Link
                            className="rounded-md border border-line px-2 py-1 text-xs font-medium"
                            href={`/assets?userId=${encodeURIComponent(item.id)}`}
                          >
                            View assets
                          </Link>
                        ) : null}
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN"}
                          onClick={() => setEditingUser({ id: item.id, name: item.name, contact: item.contact || "", email: item.email })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-line px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="button"
                          disabled={user.role !== "ADMIN" || user.id === item.id || Boolean(item._count?.assigned)}
                          onClick={() => deleteUser(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft md:col-span-2">
        <CollapseHeader
          open={backupOpen}
          title="Backup and Restore"
          subtitle="Download or restore full system data"
          onToggle={() => setBackupOpen((open) => !open)}
        />
        {backupOpen ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-line p-3">
              <h3 className="font-medium">Backup</h3>
              <p className="mt-1 text-sm text-slate-500">Download the database and uploaded files as one ZIP.</p>
              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={user.role !== "ADMIN" || backingUp || restoring}
                onClick={downloadBackup}
              >
                <Download size={16} />
                {backingUp ? "Preparing..." : "Download backup"}
              </button>
            </div>
            <div className="rounded-md border border-line p-3">
              <h3 className="font-medium">Restore</h3>
              <p className="mt-1 text-sm text-slate-500">Restore a backup ZIP. Your current admin account is kept.</p>
              <label className="mt-3 block text-sm font-medium">
                Backup ZIP
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                  type="file"
                  accept=".zip,application/zip"
                  disabled={user.role !== "ADMIN" || restoring}
                  onChange={(event) => setRestoreFile(event.target.files?.[0] || null)}
                />
              </label>
              <label className="mt-3 block text-sm font-medium">
                Type RESTORE to confirm
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  value={restoreConfirmation}
                  onChange={(event) => setRestoreConfirmation(event.target.value)}
                  disabled={user.role !== "ADMIN" || restoring}
                />
              </label>
              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={!canRestore || restoring || backingUp}
                onClick={restoreBackup}
              >
                <Upload size={16} />
                {restoring ? "Restoring..." : "Restore backup"}
              </button>
            </div>
            {user.role !== "ADMIN" ? <p className="text-sm text-slate-500 md:col-span-2">Only admin users can back up or restore the system.</p> : null}
            {backupMessage ? <p className="text-sm text-slate-600 md:col-span-2">{backupMessage}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-4 shadow-soft md:col-span-2">
        <h2 className="font-semibold text-red-700">Reset System</h2>
        <p className="mt-2 text-sm text-slate-600">
          Clears assets, staff users, maps, categories, locations, uploaded files, placements, and asset history. Admin accounts remain.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,180px]">
          <label className="text-sm font-medium">
            Type RESET to confirm
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={user.role !== "ADMIN" || resetting}
            />
          </label>
          <button
            className="self-end rounded-md bg-red-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canReset || resetting}
            onClick={resetSystem}
            type="button"
          >
            {resetting ? "Resetting..." : "Reset all"}
          </button>
        </div>
        {user.role !== "ADMIN" ? <p className="mt-3 text-sm text-slate-500">Only admin users can reset the system.</p> : null}
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>
    </main>
  );
}

function CollapseHeader({
  open,
  title,
  subtitle,
  onToggle
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onToggle: () => void;
}) {
  return (
    <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={onToggle}>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-sm text-slate-500">{subtitle}</span>
      </span>
      {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

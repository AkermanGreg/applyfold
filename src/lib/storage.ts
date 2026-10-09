import "server-only";

import { del, get, put } from "@vercel/blob";

/**
 * All user files live in a private Blob store under `users/<userId>/`. They have no public URL;
 * downloads stream through an authenticated route that checks the prefix.
 */
export function userPrefix(userId: string) {
  return `users/${userId}/`;
}

export function ownsPath(userId: string, pathname: string) {
  return pathname.startsWith(userPrefix(userId)) && !pathname.includes("..");
}

export async function putUserFile(userId: string, name: string, body: Buffer, contentType: string) {
  const blob = await put(`${userPrefix(userId)}${name}`, body, {
    access: "private",
    addRandomSuffix: true,
    contentType,
  });
  return blob.pathname;
}

export async function getUserFile(userId: string, pathname: string) {
  if (!ownsPath(userId, pathname)) return null;
  const result = await get(pathname, { access: "private" });
  return result?.statusCode === 200 ? result : null;
}

export async function deleteUserFile(userId: string, pathname: string) {
  if (ownsPath(userId, pathname)) await del(pathname);
}

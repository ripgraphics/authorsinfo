"use server"

import { revalidatePath } from "next/cache"

export async function refreshBookAuthorConnections() {
  revalidatePath("/admin/book-author-connections")
}

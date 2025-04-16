"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Format Types
export async function getFormatTypes() {
  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.from("format_types").select("*").order("id")

  if (error) {
    console.error("Error fetching format types:", error)
    throw new Error("Failed to fetch format types")
  }

  return data || []
}

export async function addFormatType(name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("format_types").insert({ name, description })

  if (error) {
    console.error("Error adding format type:", error)
    throw new Error("Failed to add format type")
  }

  revalidatePath("/admin/format-types")
}

export async function updateFormatType(id: number, name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("format_types").update({ name, description }).eq("id", id)

  if (error) {
    console.error("Error updating format type:", error)
    throw new Error("Failed to update format type")
  }

  revalidatePath("/admin/format-types")
}

export async function deleteFormatType(id: number) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("format_types").delete().eq("id", id)

  if (error) {
    console.error("Error deleting format type:", error)
    throw new Error("Failed to delete format type")
  }

  revalidatePath("/admin/format-types")
}

// Binding Types
export async function getBindingTypes() {
  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.from("binding_types").select("*").order("id")

  if (error) {
    console.error("Error fetching binding types:", error)
    throw new Error("Failed to fetch binding types")
  }

  return data || []
}

export async function addBindingType(name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("binding_types").insert({ name, description })

  if (error) {
    console.error("Error adding binding type:", error)
    throw new Error("Failed to add binding type")
  }

  revalidatePath("/admin/binding-types")
}

export async function updateBindingType(id: number, name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("binding_types").update({ name, description }).eq("id", id)

  if (error) {
    console.error("Error updating binding type:", error)
    throw new Error("Failed to update binding type")
  }

  revalidatePath("/admin/binding-types")
}

export async function deleteBindingType(id: number) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("binding_types").delete().eq("id", id)

  if (error) {
    console.error("Error deleting binding type:", error)
    throw new Error("Failed to delete binding type")
  }

  revalidatePath("/admin/binding-types")
}

// Image Types
export async function getImageTypes() {
  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.from("image_types").select("*").order("id")

  if (error) {
    console.error("Error fetching image types:", error)
    throw new Error("Failed to fetch image types")
  }

  return data || []
}

export async function addImageType(name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("image_types").insert({ name, description })

  if (error) {
    console.error("Error adding image type:", error)
    throw new Error("Failed to add image type")
  }

  revalidatePath("/admin/image-types")
}

export async function updateImageType(id: number, name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("image_types").update({ name, description }).eq("id", id)

  if (error) {
    console.error("Error updating image type:", error)
    throw new Error("Failed to update image type")
  }

  revalidatePath("/admin/image-types")
}

export async function deleteImageType(id: number) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("image_types").delete().eq("id", id)

  if (error) {
    console.error("Error deleting image type:", error)
    throw new Error("Failed to delete image type")
  }

  revalidatePath("/admin/image-types")
}

// Book Genres
export async function getBookGenres() {
  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.from("book_genres").select("*").order("id")

  if (error) {
    console.error("Error fetching book genres:", error)
    throw new Error("Failed to fetch book genres")
  }

  return data || []
}

export async function addBookGenre(name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("book_genres").insert({ name, description })

  if (error) {
    console.error("Error adding book genre:", error)
    throw new Error("Failed to add book genre")
  }

  revalidatePath("/admin/book-genres")
}

export async function updateBookGenre(id: number, name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("book_genres").update({ name, description }).eq("id", id)

  if (error) {
    console.error("Error updating book genre:", error)
    throw new Error("Failed to update book genre")
  }

  revalidatePath("/admin/book-genres")
}

export async function deleteBookGenre(id: number) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("book_genres").delete().eq("id", id)

  if (error) {
    console.error("Error deleting book genre:", error)
    throw new Error("Failed to delete book genre")
  }

  revalidatePath("/admin/book-genres")
}

// Roles
export async function getRoles() {
  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.from("roles").select("*").order("id")

  if (error) {
    console.error("Error fetching roles:", error)
    throw new Error("Failed to fetch roles")
  }

  return data || []
}

export async function addRole(name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("roles").insert({ name, description })

  if (error) {
    console.error("Error adding role:", error)
    throw new Error("Failed to add role")
  }

  revalidatePath("/admin/roles")
}

export async function updateRole(id: number, name: string, description?: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("roles").update({ name, description }).eq("id", id)

  if (error) {
    console.error("Error updating role:", error)
    throw new Error("Failed to update role")
  }

  revalidatePath("/admin/roles")
}

export async function deleteRole(id: number) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from("roles").delete().eq("id", id)

  if (error) {
    console.error("Error deleting role:", error)
    throw new Error("Failed to delete role")
  }

  revalidatePath("/admin/roles")
}

export async function updateExtraField(table: string, id: number, field: string, value: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase
    .from(table)
    .update({ [field]: value })
    .eq("id", id)

  if (error) {
    console.error(`Error updating ${field} in ${table}:`, error)
    throw new Error(`Failed to update ${field}`)
  }

  revalidatePath(`/admin/${table.replace("_", "-")}`)
}

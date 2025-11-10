import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Publisher ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch the publisher data
    const { data: publisher, error } = await supabaseAdmin
      .from("publishers")
      .select(`
        *,
        country_details:countries(id, name, code)
      `)
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching publisher:", error);
      return NextResponse.json(
        { error: "Failed to fetch publisher data" },
        { status: 500 }
      );
    }
    
    if (!publisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(publisher);
  } catch (error) {
    console.error("Error in GET /api/publishers/[id]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { section, data } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Publisher ID is required" },
        { status: 400 }
      );
    }
    
    if (!section || !data) {
      return NextResponse.json(
        { error: "Section and data are required" },
        { status: 400 }
      );
    }
    
    // Sanitize data based on section
    const sanitizedData: Record<string, any> = {};
    
    if (section === 'overview') {
      // Allow only specific fields for overview section
      if (data.about !== undefined) sanitizedData.about = data.about;
      if (data.founded_year !== undefined) {
        sanitizedData.founded_year = data.founded_year ? parseInt(data.founded_year) : null;
      }
      if (data.website !== undefined) sanitizedData.website = data.website;
    } 
    else if (section === 'contact') {
      // Allow only specific fields for contact section
      if (data.email !== undefined) sanitizedData.email = data.email;
      if (data.phone !== undefined) sanitizedData.phone = data.phone;
    } 
    else if (section === 'location') {
      // Allow only specific fields for location section
      if (data.address_line1 !== undefined) sanitizedData.address_line1 = data.address_line1;
      if (data.address_line2 !== undefined) sanitizedData.address_line2 = data.address_line2;
      if (data.city !== undefined) sanitizedData.city = data.city;
      if (data.state !== undefined) sanitizedData.state = data.state;
      if (data.postal_code !== undefined) sanitizedData.postal_code = data.postal_code;
      if (data.country !== undefined) sanitizedData.country = data.country;
    } 
    else {
      return NextResponse.json(
        { error: "Invalid section specified" },
        { status: 400 }
      );
    }
    
    // Update the publisher in the database
    const { data: updatedPublisher, error } = await supabaseAdmin
      .from("publishers")
      .update(sanitizedData)
      .eq("id", id)
      .select(`
        *,
        country_details:countries(id, name, code)
      `)
      .single();
      
    if (error) {
      console.error("Error updating publisher:", error);
      return NextResponse.json(
        { error: "Failed to update publisher" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedPublisher);
  } catch (error) {
    console.error("Error in PATCH /api/publishers/[id]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 
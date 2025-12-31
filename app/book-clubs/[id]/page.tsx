import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookClubDashboard } from '@/components/book-club-dashboard';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data: club } = await supabase
    .from('book_clubs')
    .select('name, description')
    .eq('id', params.id)
    .single();

  if (!club) {
    return {
      title: 'Book Club Not Found',
    };
  }

  return {
    title: `${club.name} - Book Club`,
    description: club.description || `Join the ${club.name} book club community`,
  };
}

export default async function BookClubPage({ params }: PageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch club details
  const { data: club, error: clubError } = await supabase
    .from('book_clubs')
    .select(`
      *,
      group:groups(name)
    `)
    .eq('id', params.id)
    .single();

  if (clubError || !club) {
    notFound();
  }

  // Fetch club members with user info
  const { data: members = [] } = await supabase
    .from('book_club_members')
    .select(`
      *,
      user:users(name, avatar_url)
    `)
    .eq('book_club_id', params.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  // Fetch reading schedules with book info
  const { data: schedules = [] } = await supabase
    .from('club_reading_schedules')
    .select(`
      *,
      book:books(
        id,
        title,
        cover_image_url,
        author_name
      )
    `)
    .eq('club_id', params.id)
    .order('start_date', { ascending: false });

  // Check if user is a member and their role
  const userMembership = members?.find((m) => m.user_id === user?.id);
  const isMember = !!userMembership;
  const isOwner = club.owner_id === user?.id;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <BookClubDashboard
        club={club}
        members={members || []}
        readingSchedules={schedules || []}
        userId={user?.id}
        isOwner={isOwner}
        isMember={isMember}
      />
    </div>
  );
}

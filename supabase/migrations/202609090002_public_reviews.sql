-- Add optional public visibility to reviews.
-- Existing reviews default to private (club-only).

ALTER TABLE public.reviews ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Any authenticated user can read reviews the author chose to make public.
-- This ORs with the existing reviews_read policy (club-sharing), so club
-- members still see private reviews from co-members.
CREATE POLICY reviews_read_public ON public.reviews
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Allow the review author to toggle visibility after creation.
GRANT UPDATE (is_public) ON public.reviews TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Create table for help articles with multilingual support
CREATE TABLE public.help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL,
  category_icon TEXT NOT NULL DEFAULT '❓',
  category_order INTEGER NOT NULL DEFAULT 0,
  question_key TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (help articles are public content)
CREATE POLICY "Help articles are publicly readable"
ON public.help_articles
FOR SELECT
USING (is_active = true);

-- Only admins can modify help articles
CREATE POLICY "Admins can manage help articles"
ON public.help_articles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_help_articles_category ON public.help_articles(category_key, category_order);
CREATE INDEX idx_help_articles_active ON public.help_articles(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_help_articles_updated_at
BEFORE UPDATE ON public.help_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
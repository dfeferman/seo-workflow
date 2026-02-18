-- Seed: Läuft mit dem ersten User in auth.users (nach erstem Sign-up ausführbar).
-- In Supabase SQL Editor ausführen (oder nach Migration: supabase db seed).

DO $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_cat_desinfekt UUID;
  v_cat_handschuhe UUID;
  v_cat_masken UUID;
  v_subcat_id UUID;
  v_artifact_id UUID;
  i INT;
  phase_letter CHAR(1);
  codes TEXT[] := ARRAY['A1','A1.2','A2.1','A2.2','B1','B2','B2.1','C1','C2','D1','D2','E1','E2','F1','F2','F3','F4','F5'];
  names TEXT[] := ARRAY[
    'Analyse Kategorie','Analyse Vertiefung','Struktur 1','Struktur 2',
    'Recherche 1','Recherche 2','Recherche 2.1','Briefing','Konzept',
    'Text 1','Text 2','Review 1','Review 2',
    'Meta 1','Meta 2','Meta 3','Meta 4','Abschluss'
  ];
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Kein User in auth.users – Seed überspringen. Bitte zuerst registrieren.';
    RETURN;
  END IF;

  -- 1. Demo-Projekt
  INSERT INTO projects (user_id, name)
  VALUES (v_user_id, 'Medizinprodukte-Shop')
  RETURNING id INTO v_project_id;

  -- 2. Drei Oberkategorien (Hubs)
  INSERT INTO categories (project_id, parent_id, name, type, hub_name, display_order)
  VALUES (v_project_id, NULL, 'Oberkategorie', 'category', 'Oberkategorie', 0)
  RETURNING id INTO v_cat_desinfekt;
  INSERT INTO categories (project_id, parent_id, name, type, hub_name, display_order)
  VALUES (v_project_id, NULL, 'Handschuhe', 'category', 'Handschuhe', 1)
  RETURNING id INTO v_cat_handschuhe;
  INSERT INTO categories (project_id, parent_id, name, type, hub_name, display_order)
  VALUES (v_project_id, NULL, 'Masken', 'category', 'Masken', 2)
  RETURNING id INTO v_cat_masken;

  -- 3. Vier Unterkategorien unter Oberkategorie
  INSERT INTO categories (project_id, parent_id, name, type, display_order)
  VALUES
    (v_project_id, v_cat_desinfekt, 'Händedesinfektion', 'category', 0),
    (v_project_id, v_cat_desinfekt, 'Flächendesinfektion', 'category', 1),
    (v_project_id, v_cat_desinfekt, 'Instrumentendesinfektion', 'category', 2),
    (v_project_id, v_cat_desinfekt, 'Spezialprodukte', 'category', 3);

  -- Kategorie für Standard-Artefakte: erste Unterkategorie (Händedesinfektion)
  SELECT id INTO v_subcat_id FROM categories
  WHERE project_id = v_project_id AND parent_id = v_cat_desinfekt
  ORDER BY display_order LIMIT 1;

  -- 4. 18 Standard-Artefakte für diese eine Kategorie
  FOR i IN 1..array_length(codes, 1) LOOP
    phase_letter := LEFT(codes[i], 1);
    INSERT INTO artifacts (category_id, phase, artifact_code, name, prompt_template, display_order)
    VALUES (
      v_subcat_id,
      phase_letter,
      codes[i],
      names[i],
      'Arbeitsanweisung für [' || codes[i] || ']: Nutze [KATEGORIE] und [ZIELGRUPPEN].',
      i - 1
    );
  END LOOP;

  -- 5. Zehn Standard-Templates
  INSERT INTO templates (user_id, name, description, phase, artifact_code, prompt_template, tags)
  VALUES
    (v_user_id, 'SEO-Kurzbriefing', 'Kurzes Briefing für Content', 'C', 'C1', 'Erstelle ein Kurzbriefing für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN].', ARRAY['SEO','Briefing','Content']),
    (v_user_id, 'Meta-Beschreibung', 'Vorlage für Meta Description', 'F', 'F1', 'Schreibe eine Meta-Description für [KATEGORIE], max. 155 Zeichen. Tonalität: [TON].', ARRAY['SEO','Meta']),
    (v_user_id, 'USP-Liste', 'USPs für Kategorie', 'A', 'A1', 'Liste 5 USPs für [KATEGORIE] und [ZIELGRUPPEN].', ARRAY['SEO','Analyse','USP']),
    (v_user_id, 'SERP-Analyse', 'Top-Ergebnisse und Intent analysieren', 'A', 'A1', 'Analysiere die Top-10-Suchergebnisse für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN]. Erstelle eine Tabelle mit URL, Titel, Intent und Besonderheiten.', ARRAY['SEO','Analyse','SERP']),
    (v_user_id, 'Konkurrenz-Check', 'Wettbewerber und Stärken/Schwächen', 'A', 'A2.1', 'Identifiziere die 5 stärksten Wettbewerber für [KATEGORIE]. Analysiere deren Content-Strategie und USPs. Output: Tabelle mit Konkurrent, Stärken, Schwächen.', ARRAY['SEO','Analyse','Konkurrenz']),
    (v_user_id, 'Content-Outline', 'Struktur und Überschriften für einen Text', 'C', 'C2', 'Erstelle eine detaillierte Content-Outline für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN]. Tonalität: [TON]. Berücksichtige [USPs] und vermeide [NO-GOS].', ARRAY['SEO','Briefing','Outline']),
    (v_user_id, 'Produktbeschreibung', 'Verkaufsorientierter Fließtext', 'D', 'D1', 'Schreibe eine verkaufsorientierte Produktbeschreibung für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN]. Shop-Typ: [SHOP-TYP]. Tonalität: [TON]. USPs: [USPs]. Keine [NO-GOS].', ARRAY['SEO','Text','Produkt']),
    (v_user_id, 'FAQ-Block', 'Häufige Fragen und Antworten', 'D', 'D2', 'Erstelle 8–10 FAQ mit Antworten für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN]. Tonalität: [TON]. Antworten jeweils 2–4 Sätze.', ARRAY['SEO','Text','FAQ']),
    (v_user_id, 'Title-Tag-Vorschläge', 'SEO-Titel für die Seite', 'F', 'F1', 'Schreibe 3 Varianten für einen Title-Tag (ca. 50–60 Zeichen) für [KATEGORIE]. Zielgruppen: [ZIELGRUPPEN].', ARRAY['SEO','Meta','Title']),
    (v_user_id, 'E-E-A-T-Check', 'Experience, Expertise, Authoritativeness, Trust', 'F', 'F2', 'Prüfe den folgenden Text auf E-E-A-T: Sind Erfahrung, Expertise, Autorität und Vertrauen ausreichend abgebildet? Zielgruppe: [ZIELGRUPPEN]. Gib konkrete Verbesserungsvorschläge.', ARRAY['SEO','QA','E-E-A-T']);

  RAISE NOTICE 'Seed erfolgreich: Projekt %, Kategorien, Artefakte und 10 Templates angelegt.', v_project_id;
END $$;

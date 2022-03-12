--
-- PostgreSQL database dump
--

-- Dumped from database version 11.10 (Ubuntu 11.10-1.pgdg20.04+1)
-- Dumped by pg_dump version 11.10 (Ubuntu 11.10-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: comment_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.comment_mode AS ENUM (
    'discover',
    'following-only'
);


ALTER TYPE public.comment_mode OWNER TO postgres;

--
-- Name: comment_reply_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.comment_reply_mode AS ENUM (
    'basic',
    'quick'
);


ALTER TYPE public.comment_reply_mode OWNER TO postgres;

--
-- Name: group_commenting_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.group_commenting_mode AS ENUM (
    'anyone-that-can-view',
    'only-flagged-members'
);


ALTER TYPE public.group_commenting_mode OWNER TO postgres;

--
-- Name: group_posting_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.group_posting_mode AS ENUM (
    'anyone-that-can-view',
    'only-flagged-members'
);


ALTER TYPE public.group_posting_mode OWNER TO postgres;

--
-- Name: group_viewing_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.group_viewing_mode AS ENUM (
    'anyone',
    'members-only'
);


ALTER TYPE public.group_viewing_mode OWNER TO postgres;

--
-- Name: post_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.post_mode AS ENUM (
    'discover',
    'following-only'
);


ALTER TYPE public.post_mode OWNER TO postgres;

--
-- Name: f_comment_spam_vote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_comment_spam_vote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  update ttest set num_spam_votes = num_spam_votes + 1 where comment_id = new.comment_id;

  return null;

END; $$;


ALTER FUNCTION public.f_comment_spam_vote() OWNER TO postgres;

--
-- Name: f_post_comment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_post_comment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update tpost set last_comment = new.created_on where post_id = new.post_id;
  return null;
END; $$;


ALTER FUNCTION public.f_post_comment() OWNER TO postgres;

--
-- Name: f_post_spam_vote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_post_spam_vote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  update tpost set num_spam_votes = num_spam_votes + 1 where post_id = new.post_id;

  return null;

END; $$;


ALTER FUNCTION public.f_post_spam_vote() OWNER TO postgres;

--
-- Name: f_post_tag(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_post_tag() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update ttag set num_posts = num_posts + 1 where tag_id = new.tag_id;
  return null;
END; $$;


ALTER FUNCTION public.f_post_tag() OWNER TO postgres;

--
-- Name: f_post_tag_del(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_post_tag_del() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update ttag set num_posts = num_posts - 1 where tag_id = old.tag_id;
  return null;
END; $$;


ALTER FUNCTION public.f_post_tag_del() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: tdomainname; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tdomainname (
    domain_name_id integer NOT NULL,
    domain_name character varying(256)
);


ALTER TABLE public.tdomainname OWNER TO postgres;

--
-- Name: tdomainname_domain_name_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tdomainname_domain_name_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tdomainname_domain_name_id_seq OWNER TO postgres;

--
-- Name: tdomainname_domain_name_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tdomainname_domain_name_id_seq OWNED BY public.tdomainname.domain_name_id;


--
-- Name: tfollower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tfollower (
    follower_id integer NOT NULL,
    user_id integer NOT NULL,
    followee_user_id integer NOT NULL
);


ALTER TABLE public.tfollower OWNER TO postgres;

--
-- Name: tfollower_follower_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tfollower_follower_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tfollower_follower_id_seq OWNER TO postgres;

--
-- Name: tfollower_follower_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tfollower_follower_id_seq OWNED BY public.tfollower.follower_id;


--
-- Name: tgroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tgroup (
    group_id integer NOT NULL,
    created_by integer NOT NULL,
    owned_by integer NOT NULL,
    name character varying(36) NOT NULL,
    group_viewing_mode public.group_viewing_mode DEFAULT 'anyone'::public.group_viewing_mode NOT NULL,
    group_posting_mode public.group_posting_mode DEFAULT 'anyone-that-can-view'::public.group_posting_mode NOT NULL,
    group_commenting_mode public.group_commenting_mode DEFAULT 'anyone-that-can-view'::public.group_commenting_mode NOT NULL
);


ALTER TABLE public.tgroup OWNER TO postgres;

--
-- Name: tgroup_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tgroup_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tgroup_group_id_seq OWNER TO postgres;

--
-- Name: tgroup_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tgroup_group_id_seq OWNED BY public.tgroup.group_id;


--
-- Name: tgroupmember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tgroupmember (
    group_member_id integer NOT NULL,
    private_group_id integer NOT NULL,
    user_id integer NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tgroupmember OWNER TO postgres;

--
-- Name: tgroupmember_group_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tgroupmember_group_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tgroupmember_group_member_id_seq OWNER TO postgres;

--
-- Name: tgroupmember_group_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tgroupmember_group_member_id_seq OWNED BY public.tgroupmember.group_member_id;


--
-- Name: tmember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tmember (
    member_id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    is_moderator boolean DEFAULT false NOT NULL,
    is_poster boolean DEFAULT false NOT NULL,
    is_commenter boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tmember OWNER TO postgres;

--
-- Name: tmember_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tmember_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tmember_member_id_seq OWNER TO postgres;

--
-- Name: tmember_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tmember_member_id_seq OWNED BY public.tmember.member_id;


--
-- Name: tpost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tpost (
    post_id integer NOT NULL,
    public_id character varying(32) NOT NULL,
    user_id integer NOT NULL,
    title character varying(160) NOT NULL,
    text_content text,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    is_removed boolean DEFAULT false NOT NULL,
    link character varying(400) DEFAULT NULL::character varying,
    num_comments integer DEFAULT 0,
    num_spam_votes integer DEFAULT 0,
    removed_on timestamp with time zone,
    domain_name_id integer,
    last_comment timestamp with time zone
);


ALTER TABLE public.tpost OWNER TO postgres;

--
-- Name: tpost_post_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tpost_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tpost_post_id_seq OWNER TO postgres;

--
-- Name: tpost_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tpost_post_id_seq OWNED BY public.tpost.post_id;


--
-- Name: tposttag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tposttag (
    posttag_id integer NOT NULL,
    tag_id integer NOT NULL,
    post_id integer NOT NULL
);


ALTER TABLE public.tposttag OWNER TO postgres;

--
-- Name: tposttag_posttag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tposttag_posttag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tposttag_posttag_id_seq OWNER TO postgres;

--
-- Name: tposttag_posttag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tposttag_posttag_id_seq OWNED BY public.tposttag.posttag_id;


--
-- Name: tprivategroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tprivategroup (
    private_group_id integer NOT NULL,
    created_by integer NOT NULL,
    name character varying(32) NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tprivategroup OWNER TO postgres;

--
-- Name: tprivategroup_private_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tprivategroup_private_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tprivategroup_private_group_id_seq OWNER TO postgres;

--
-- Name: tprivategroup_private_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tprivategroup_private_group_id_seq OWNED BY public.tprivategroup.private_group_id;


--
-- Name: tspamcomment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tspamcomment (
    spamcomment_id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tspamcomment OWNER TO postgres;

--
-- Name: tspamcomment_spamcomment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tspamcomment_spamcomment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tspamcomment_spamcomment_id_seq OWNER TO postgres;

--
-- Name: tspamcomment_spamcomment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tspamcomment_spamcomment_id_seq OWNED BY public.tspamcomment.spamcomment_id;


--
-- Name: tspampost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tspampost (
    spampost_id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tspampost OWNER TO postgres;

--
-- Name: tspampost_spampost_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tspampost_spampost_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tspampost_spampost_id_seq OWNER TO postgres;

--
-- Name: tspampost_spampost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tspampost_spampost_id_seq OWNED BY public.tspampost.spampost_id;


--
-- Name: ttag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ttag (
    tag_id integer NOT NULL,
    tag character varying(32) NOT NULL,
    num_posts integer DEFAULT 0 NOT NULL,
    is_removed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ttag OWNER TO postgres;

--
-- Name: ttag_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ttag_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ttag_tag_id_seq OWNER TO postgres;

--
-- Name: ttag_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ttag_tag_id_seq OWNED BY public.ttag.tag_id;


--
-- Name: ttest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ttest (
    comment_id integer NOT NULL,
    public_id character varying(32) NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    text_content text NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    path public.ltree,
    is_removed boolean DEFAULT false NOT NULL,
    num_spam_votes integer DEFAULT 0,
    removed_on timestamp with time zone
);


ALTER TABLE public.ttest OWNER TO postgres;

--
-- Name: ttest_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ttest_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ttest_comment_id_seq OWNER TO postgres;

--
-- Name: ttest_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ttest_comment_id_seq OWNED BY public.ttest.comment_id;


--
-- Name: tuser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tuser (
    user_id integer NOT NULL,
    username character varying(32) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255),
    time_zone character varying(64) DEFAULT 'UTC'::character varying NOT NULL,
    post_mode public.post_mode DEFAULT 'discover'::public.post_mode NOT NULL,
    comment_mode public.comment_mode DEFAULT 'discover'::public.comment_mode NOT NULL,
    is_eyes boolean DEFAULT false NOT NULL,
    eyes integer,
    comment_reply_mode public.comment_reply_mode DEFAULT 'quick'::public.comment_reply_mode NOT NULL,
    site_width smallint DEFAULT 600,
    public_id character varying(32) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.tuser OWNER TO postgres;

--
-- Name: tuser_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tuser_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tuser_user_id_seq OWNER TO postgres;

--
-- Name: tuser_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tuser_user_id_seq OWNED BY public.tuser.user_id;


--
-- Name: tdomainname domain_name_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tdomainname ALTER COLUMN domain_name_id SET DEFAULT nextval('public.tdomainname_domain_name_id_seq'::regclass);


--
-- Name: tfollower follower_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tfollower ALTER COLUMN follower_id SET DEFAULT nextval('public.tfollower_follower_id_seq'::regclass);


--
-- Name: tgroup group_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tgroup ALTER COLUMN group_id SET DEFAULT nextval('public.tgroup_group_id_seq'::regclass);


--
-- Name: tgroupmember group_member_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tgroupmember ALTER COLUMN group_member_id SET DEFAULT nextval('public.tgroupmember_group_member_id_seq'::regclass);


--
-- Name: tmember member_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tmember ALTER COLUMN member_id SET DEFAULT nextval('public.tmember_member_id_seq'::regclass);


--
-- Name: tpost post_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tpost ALTER COLUMN post_id SET DEFAULT nextval('public.tpost_post_id_seq'::regclass);


--
-- Name: tposttag posttag_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tposttag ALTER COLUMN posttag_id SET DEFAULT nextval('public.tposttag_posttag_id_seq'::regclass);


--
-- Name: tprivategroup private_group_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tprivategroup ALTER COLUMN private_group_id SET DEFAULT nextval('public.tprivategroup_private_group_id_seq'::regclass);


--
-- Name: tspamcomment spamcomment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tspamcomment ALTER COLUMN spamcomment_id SET DEFAULT nextval('public.tspamcomment_spamcomment_id_seq'::regclass);


--
-- Name: tspampost spampost_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tspampost ALTER COLUMN spampost_id SET DEFAULT nextval('public.tspampost_spampost_id_seq'::regclass);


--
-- Name: ttag tag_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ttag ALTER COLUMN tag_id SET DEFAULT nextval('public.ttag_tag_id_seq'::regclass);


--
-- Name: ttest comment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ttest ALTER COLUMN comment_id SET DEFAULT nextval('public.ttest_comment_id_seq'::regclass);


--
-- Name: tuser user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuser ALTER COLUMN user_id SET DEFAULT nextval('public.tuser_user_id_seq'::regclass);


--
-- Name: tdomainname tdomainname_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tdomainname
    ADD CONSTRAINT tdomainname_pkey PRIMARY KEY (domain_name_id);


--
-- Name: tfollower tfollower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tfollower
    ADD CONSTRAINT tfollower_pkey PRIMARY KEY (follower_id);


--
-- Name: tgroup tgroup_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tgroup
    ADD CONSTRAINT tgroup_name_key UNIQUE (name);


--
-- Name: tgroup tgroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tgroup
    ADD CONSTRAINT tgroup_pkey PRIMARY KEY (group_id);


--
-- Name: tgroupmember tgroupmember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tgroupmember
    ADD CONSTRAINT tgroupmember_pkey PRIMARY KEY (group_member_id);


--
-- Name: tmember tmember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tmember
    ADD CONSTRAINT tmember_pkey PRIMARY KEY (member_id);


--
-- Name: tpost tpost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tpost
    ADD CONSTRAINT tpost_pkey PRIMARY KEY (post_id);


--
-- Name: tposttag tposttag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tposttag
    ADD CONSTRAINT tposttag_pkey PRIMARY KEY (posttag_id);


--
-- Name: tprivategroup tprivategroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tprivategroup
    ADD CONSTRAINT tprivategroup_pkey PRIMARY KEY (private_group_id);


--
-- Name: tspamcomment tspamcomment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tspamcomment
    ADD CONSTRAINT tspamcomment_pkey PRIMARY KEY (spamcomment_id);


--
-- Name: tspampost tspampost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tspampost
    ADD CONSTRAINT tspampost_pkey PRIMARY KEY (spampost_id);


--
-- Name: ttag ttag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ttag
    ADD CONSTRAINT ttag_pkey PRIMARY KEY (tag_id);


--
-- Name: ttest ttest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ttest
    ADD CONSTRAINT ttest_pkey PRIMARY KEY (comment_id);


--
-- Name: tuser tuser_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuser
    ADD CONSTRAINT tuser_email_key UNIQUE (email);


--
-- Name: tuser tuser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuser
    ADD CONSTRAINT tuser_pkey PRIMARY KEY (user_id);


--
-- Name: path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX path_idx ON public.ttest USING gist (path);


--
-- Name: username_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX username_unique_idx ON public.tuser USING btree (lower((username)::text));


--
-- Name: tspamcomment comment_spam_vote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER comment_spam_vote AFTER INSERT ON public.tspamcomment FOR EACH ROW EXECUTE PROCEDURE public.f_comment_spam_vote();


--
-- Name: ttest post_comment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER post_comment AFTER INSERT ON public.ttest FOR EACH ROW EXECUTE PROCEDURE public.f_post_comment();


--
-- Name: tspampost post_spam_vote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER post_spam_vote AFTER INSERT ON public.tspampost FOR EACH ROW EXECUTE PROCEDURE public.f_post_spam_vote();


--
-- Name: tposttag post_tag; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER post_tag AFTER INSERT ON public.tposttag FOR EACH ROW EXECUTE PROCEDURE public.f_post_tag();


--
-- Name: tposttag post_tag_del; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER post_tag_del AFTER DELETE ON public.tposttag FOR EACH ROW EXECUTE PROCEDURE public.f_post_tag_del();


--
-- PostgreSQL database dump complete
--


-- this file may not be completely accurate
-- use the structure dump instead

create table tuser (
    user_id serial primary key,
    username varchar(32) not null,
    password varchar(255) not null,
    email varchar(255) unique
);

CREATE UNIQUE INDEX username_unique_idx on tuser (LOWER(username));

alter table tuser add column time_zone varchar(64) not null default 'UTC';

create table tgroup (
    group_id serial primary key,
    created_by integer not null,
    owned_by integer not null,
    name varchar(36) unique not null
);

create type group_viewing_mode as enum('anyone', 'members-only');
alter table tgroup add column group_viewing_mode group_viewing_mode not null default 'anyone';

create type group_posting_mode as enum('anyone-that-can-view', 'only-flagged-members');
alter table tgroup add column group_posting_mode group_posting_mode not null default 'anyone-that-can-view';

create type group_commenting_mode as enum('anyone-that-can-view', 'only-flagged-members');
alter table tgroup add column group_commenting_mode group_commenting_mode not null default 'anyone-that-can-view';

create table tpost (
    post_id serial primary key,
    public_id varchar(32) not null,
    group_id integer not null,
    user_id integer not null,
    title varchar(50) not null,
    text_content text,
    created_on timestamp with time zone not null default now()
);

alter table tpost add column is_removed boolean not null default FALSE;
alter table tpost add column link varchar(400) default null;
alter table tpost add column num_comments integer default 0;
alter table tpost add column num_spam_votes integer default 0;
alter table tpost add column removed_on timestamp with time zone default null;

create table ttest (
    comment_id serial primary key,
    public_id varchar(32) not null,
    post_id integer not null,
    user_id integer not null,
    text_content text not null,
    created_on timestamp with time zone not null default now(),
    path ltree
);
create index path_idx on ttest using gist(path);
alter table ttest add column is_removed boolean not null default FALSE;
alter table ttest add column num_spam_votes integer default 0;
alter table ttest add column removed_on timestamp with time zone default null;

create table tcomment {
    comment_id serial primary key,
    public_id varchar(32) not null,
    post_id integer not null,
    group_id integer not null,
    user_id integer not null,
    text_content text not null,
    created_on timestamp with time zone not null default now(),
    path ltree
};

//
create table tmember (
    member_id serial primary key,
    group_id integer not null,
    user_id integer not null
);

alter table tmember add column is_moderator boolean not null default FALSE;
alter table tmember add column is_poster boolean not null default FALSE;
alter table tmember add column is_commenter boolean not null default FALSE;

--
create table tspampost (
    spampost_id serial primary key,
    post_id integer not null,
    user_id integer not null,
    created_on timestamp with time zone not null default now()
);

create trigger post_spam_vote
    after insert
    on tspampost
    for each row
    execute procedure f_post_spam_vote();

CREATE OR REPLACE FUNCTION f_post_spam_vote()
RETURNS TRIGGER AS $$
BEGIN
  update tpost set num_spam_votes = num_spam_votes + 1 where post_id = new.post_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

--
create table tspamcomment (
    spamcomment_id serial primary key,
    comment_id integer not null,
    user_id integer not null,
    created_on timestamp with time zone not null default now()
);

create trigger comment_spam_vote
    after insert
    on tspamcomment
    for each row
    execute procedure f_comment_spam_vote();

CREATE OR REPLACE FUNCTION f_comment_spam_vote()
RETURNS TRIGGER AS $$
BEGIN
  update ttest set num_spam_votes = num_spam_votes + 1 where comment_id = new.comment_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

--
create table tfollower (
    follower_id serial primary key,
    user_id integer not null,
    followee_user_id integer not null
);

--
create table ttag (
    tag_id serial primary key,
    tag varchar(32) not null,
    num_posts integer not null default 0,
    is_removed boolean not null default FALSE
);

create table tposttag (
    posttag_id serial primary key,
    tag_id integer not null,
    post_id integer not null
);

create trigger post_tag
    after insert
    on tposttag
    for each row
    execute procedure f_post_tag();

CREATE OR REPLACE FUNCTION f_post_tag()
RETURNS TRIGGER AS $$
BEGIN
  update ttag set num_posts = num_posts + 1 where tag_id = new.tag_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

--
-- https://redd.it/eqqoam

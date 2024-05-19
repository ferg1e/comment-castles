
--This file will always grow downwards and
--existing commands will not be edited. Only
--new commands will be added to the end of
--the file.

--
alter table tuser add column public_id varchar(32) not null default '';

--
create table tdomainname (
    domain_name_id serial primary key,
    domain_name varchar(256)
);

alter table tpost add column domain_name_id integer default null;

--
alter table tpost add column last_comment timestamp with time zone default null;

CREATE OR REPLACE FUNCTION f_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  update tpost set last_comment = new.created_on where post_id = new.post_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

create trigger post_comment
    after insert
    on ttest
    for each row
    execute procedure f_post_comment();

--
create table tprivategroup (
    private_group_id serial primary key,
    created_by integer not null,
    name varchar(32) not null,
    created_on timestamp with time zone not null default now()
);

create table tgroupmember (
    group_member_id serial primary key,
    private_group_id integer not null,
    user_id integer not null,
    created_on timestamp with time zone not null default now()
);

--
create table tnetworknode (
    network_node_id serial primary key,
    node_url varchar(256),
    created_on timestamp with time zone not null default now()
);

--
create index idx_tposttag_post_id on tposttag(post_id);
create index idx_tprivategroup_name on tprivategroup(name);
create index idx_ttag_tag on ttag(tag);

--
CREATE OR REPLACE FUNCTION f_comment_del()
RETURNS TRIGGER AS $$
BEGIN
  update tpost set num_comments = num_comments - 1 where post_id = old.post_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

create trigger comment_del
    after delete
    on ttest
    for each row
    execute procedure f_comment_del();

--
alter table ttest rename to tcomment;
drop table tgroup, tmember, tspamcomment, tspampost;

--
create table toauthclient (
    client_id serial primary key,
    user_id integer not null,
    app_name varchar(64) not null,
    redirect_uri varchar(256) not null,
    public_client_id varchar(32) not null
);

--
create table toauthauthcode (
    authcode_id serial primary key,
    client_id integer not null,
    logged_in_user_id integer not null,
    code varchar(40) not null,
    redirect_uri varchar(256) not null,
    expires_on timestamp with time zone not null
);

--
create table toauthaccesstoken (
    accesstoken_id serial primary key,
    client_id integer not null,
    logged_in_user_id integer not null,
    token varchar(40) not null,
    expires_on timestamp with time zone not null
);

--
drop table tnetworknode;

--
drop trigger comment_del on tcomment;

CREATE OR REPLACE FUNCTION f_comment_del()
RETURNS TRIGGER AS $$
BEGIN
  update
    tpost
  set
    num_comments = num_comments - 1,
    last_comment = (select max(created_on) from tcomment where post_id = old.post_id)
  where
    post_id = old.post_id;
  return null;
END; $$ LANGUAGE 'plpgsql';

create trigger comment_del
    after delete
    on tcomment
    for each row
    execute procedure f_comment_del();

--
create type post_layout as enum('single-line', 'double-line');
alter table tuser add column post_layout post_layout not null default 'double-line';

--
alter table tuser add column posts_per_page smallint default 20;
alter table tuser add column two_bg_color char(6) default 'e7e5df';
alter table tuser add column one_bg_color char(6) default 'fefefe';

--
create type cc_method as enum('plain', 'S256');
alter table toauthauthcode add column cc_method cc_method not null default 'S256';
alter table toauthauthcode add column code_challenge char(43) not null default '';

--
alter table tuser add column profile_blurb text default null;

--
alter table tuser add column main_text_color char(6) default '232323';
alter table tuser add column posts_vertical_spacing smallint default 18;

--
alter table tuser drop column is_eyes;
alter table tuser drop column eyes;

alter table only tuser alter column post_mode set default 'following-only';

--
alter table tuser add column post_link_color char(6) not null default '0000ff';
alter table tuser add column post_link_visited_color char(6) not null default '551a8b';
alter table tuser add column group_bg_color char(6) not null default 'e6e7dc';
alter table tuser add column group_text_color char(6) not null default '030303';
alter table tuser add column hidden_color char(6) not null default 'b2b2b2';
alter table tuser add column domain_name_color char(6) not null default '50794b';
alter table tuser add column unfollow_bg_color char(6) not null default 'f3cece';
alter table tuser add column unfollow_line_color char(6) not null default '666666';
alter table tuser add column unfollow_text_color char(6) not null default '000000';
alter table tuser add column follow_bg_color char(6) not null default 'cbeed1';
alter table tuser add column follow_line_color char(6) not null default '666666';
alter table tuser add column follow_text_color char(6) not null default '000000';
alter table tuser add column main_link_color char(6) not null default '0000d2';
alter table tuser add column nav_link_color char(6) not null default '4b4949';
alter table tuser add column footer_link_color char(6) not null default '9b4747';
alter table tuser add column page_bg_color char(6) not null default 'ffcc80';
alter table tuser add column page_line_color char(6) not null default '000000';
alter table tuser add column page_text_color char(6) not null default '000000';
alter table tuser add column high_bg_color char(6) not null default 'f8edbd';
alter table tuser add column high_text_color char(6) not null default '232323';
alter table tuser add column high_link_color char(6) not null default '0000d2';
alter table tuser add column comment_head_color char(6) not null default '9b9292';
alter table tuser add column comment_user_color char(6) not null default '5f5f64';
alter table tuser add column comment_foot_color char(6) not null default '994949';
alter table tuser add column pre_bg_color char(6) not null default 'e2e2e2';
alter table tuser add column pre_text_color char(6) not null default '232323';
alter table tuser add column pre_link_color char(6) not null default '0000ff';
alter table tuser add column success_text_color char(6) not null default '009900';
alter table tuser add column error_text_color char(6) not null default 'bb0000';
alter table tuser add column em_bg_color char(6) not null default 'e8e8e8';
alter table tuser add column em_text_color char(6) not null default '232323';
alter table tuser add column content_link_color char(6) not null default '0000ff';
alter table tuser add column comment_outline_color char(6) not null default 'ebbc58';

alter table tuser drop two_bg_color;
alter table tuser drop one_bg_color;
alter table tuser drop main_text_color;
alter table tuser drop post_link_color;
alter table tuser drop post_link_visited_color;
alter table tuser drop group_bg_color;
alter table tuser drop group_text_color;
alter table tuser drop hidden_color;
alter table tuser drop domain_name_color;
alter table tuser drop unfollow_bg_color;
alter table tuser drop unfollow_line_color;
alter table tuser drop unfollow_text_color;
alter table tuser drop follow_bg_color;
alter table tuser drop follow_line_color;
alter table tuser drop follow_text_color;
alter table tuser drop main_link_color;
alter table tuser drop nav_link_color;
alter table tuser drop footer_link_color;
alter table tuser drop page_bg_color;
alter table tuser drop page_line_color;
alter table tuser drop page_text_color;
alter table tuser drop high_bg_color;
alter table tuser drop high_text_color;
alter table tuser drop high_link_color;
alter table tuser drop comment_head_color;
alter table tuser drop comment_user_color;
alter table tuser drop comment_foot_color;
alter table tuser drop pre_bg_color;
alter table tuser drop pre_text_color;
alter table tuser drop pre_link_color;
alter table tuser drop success_text_color;
alter table tuser drop error_text_color;
alter table tuser drop em_bg_color;
alter table tuser drop em_text_color;
alter table tuser drop content_link_color;
alter table tuser drop comment_outline_color;

create type theme as enum('original', 'dark-mode');
alter table tuser add column theme theme not null default 'original';

alter table tuser add column date_format varchar(32) default 'Mon FMDD, YYYY FMHH12:MIam';

--
drop table tfollower;

alter table tuser drop post_mode;
alter table tuser drop comment_mode;

--
create table tsub (
    sub_id serial primary key,
    slug varchar(32) not null,
    lead_mod integer,
    sub_desc text
);

insert into tsub (slug, lead_mod) values ('before', 1);
alter table tpost add column sub_id integer not null default 1;

alter table tpost drop is_removed;
alter table tpost drop removed_on;
alter table tcomment drop is_removed;
alter table tcomment drop removed_on;

alter table tpost drop num_spam_votes;
alter table tcomment drop num_spam_votes;
alter table tuser drop email;

alter table tsub add column is_post_locked boolean not null default false;

--
drop table ttag, tposttag, tgroupmember, tprivategroup;

--
alter table tcomment add constraint fk_post foreign key(post_id) references tpost on delete cascade;

--
create table tdirectmessage (
    dm_id serial primary key,
    from_user_id integer not null references tuser,
    to_user_id integer not null references tuser,
    dmessage text not null,
    created_on timestamp with time zone not null default now()
);

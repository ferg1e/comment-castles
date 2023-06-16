
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

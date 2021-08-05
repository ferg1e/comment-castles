
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

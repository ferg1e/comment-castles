--set num_comments for all posts
update
    tpost p
set
    num_comments = (select count(1) from ttest where path <@ text2ltree(p.post_id::text));

--list num_comments for all posts
select
    p.post_id,
    p.title,
    (select count(1) from ttest where path <@ text2ltree(p.post_id::text)) num_comments
from
    tpost p
order by
    p.post_id;

-- clear/truncate all tables and reset "autoincrement"
truncate tfollower, tpost, tposttag, ttag, ttest, tuser restart identity;

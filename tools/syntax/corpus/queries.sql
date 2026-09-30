SELECT m.id AS member_id, COUNT(*) AS total
FROM members AS m
WHERE m.workspace_id = :workspace AND m.role <> 'owner'
GROUP BY m.id
HAVING COUNT(*) > 2;

UPDATE members SET role = @role WHERE id = $1;

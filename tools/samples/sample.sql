-- Members that were promoted in the last 30 days, with who did it.
WITH recent AS (
    SELECT
        m.id,
        m.email,
        m.role,
        a.actor_id,
        ROW_NUMBER() OVER (PARTITION BY m.id ORDER BY a.created_at DESC) AS rn
    FROM members AS m
    INNER JOIN audit_log AS a ON a.subject_id = m.id
    WHERE a.action = 'member.promoted'
      AND a.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
    r.email,
    r.role,
    COALESCE(u.display_name, '(deleted user)') AS promoted_by,
    COUNT(*) OVER () AS total
FROM recent AS r
LEFT JOIN users AS u ON u.id = r.actor_id
WHERE r.rn = 1 AND r.role <> 'owner'
ORDER BY r.email ASC
LIMIT 50;

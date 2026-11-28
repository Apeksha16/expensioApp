package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.dto.FriendItemDto;
import com.expensio.backend.friends.dto.FriendshipDirection;
import com.expensio.backend.friends.dto.GuestSummaryDto;
import com.expensio.backend.friends.dto.ParticipantSummaryDto;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class JdbcFriendReadRepository implements FriendReadRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public JdbcFriendReadRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<FriendItemDto> findUserFriendshipsPage(
            UUID callerId,
            Instant cursorCreatedAt,
            UUID cursorId,
            int limitPlusOne) {

        StringBuilder sql = new StringBuilder("""
                SELECT f.id AS friendship_id,
                       f.requester_id,
                       f.addressee_id,
                       f.status,
                       f.created_at,
                       f.accepted_at,
                       u.id AS user_id,
                       u.name AS display_name,
                       up.username,
                       up.avatar_id
                FROM friendships f
                JOIN participants p
                  ON p.id = CASE WHEN f.requester_id = :callerId THEN f.addressee_id ELSE f.requester_id END
                JOIN users u
                  ON u.id = p.id
                LEFT JOIN user_profiles up
                  ON up.user_id = u.id
                WHERE (f.requester_id = :callerId OR f.addressee_id = :callerId)
                  AND p.kind = 'USER'
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("callerId", callerId)
                .addValue("limitPlusOne", limitPlusOne);

        if (cursorCreatedAt != null && cursorId != null) {
            sql.append("""
                      AND (f.created_at < :cursorCreatedAt
                           OR (f.created_at = :cursorCreatedAt AND f.id < :cursorId))
                    """);
            params.addValue("cursorCreatedAt", Timestamp.from(cursorCreatedAt));
            params.addValue("cursorId", cursorId);
        }

        sql.append(" ORDER BY f.created_at DESC, f.id DESC LIMIT :limitPlusOne");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            UUID friendshipId = rs.getObject("friendship_id", UUID.class);
            UUID requesterId = rs.getObject("requester_id", UUID.class);
            FriendshipStatus status = FriendshipStatus.valueOf(rs.getString("status"));
            FriendshipDirection direction = status == FriendshipStatus.ACCEPTED
                    ? FriendshipDirection.NONE
                    : (requesterId.equals(callerId) ? FriendshipDirection.OUTGOING : FriendshipDirection.INCOMING);

            Timestamp createdTs = rs.getTimestamp("created_at");
            Timestamp acceptedTs = rs.getTimestamp("accepted_at");

            ParticipantSummaryDto participant = new ParticipantSummaryDto(
                    rs.getObject("user_id", UUID.class),
                    rs.getString("display_name"),
                    rs.getString("username"),
                    rs.getString("avatar_id"),
                    false
            );

            return new FriendItemDto(
                    friendshipId,
                    status,
                    direction,
                    createdTs != null ? createdTs.toInstant() : null,
                    acceptedTs != null ? acceptedTs.toInstant() : null,
                    participant
            );
        });
    }

    @Override
    public List<GuestSummaryDto> findActiveGuests(UUID callerId) {
        String sql = """
                SELECT g.id,
                       g.name,
                       g.username,
                       g.avatar_id,
                       g.created_at
                FROM guest_profiles g
                WHERE g.owner_user_id = :callerId
                  AND g.retired_at IS NULL
                ORDER BY g.created_at ASC, g.id ASC
                """;

        MapSqlParameterSource params = new MapSqlParameterSource("callerId", callerId);
        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            Timestamp createdTs = rs.getTimestamp("created_at");
            return new GuestSummaryDto(
                    rs.getObject("id", UUID.class),
                    rs.getString("name"),
                    rs.getString("username"),
                    rs.getString("avatar_id"),
                    true,
                    createdTs != null ? createdTs.toInstant() : null
            );
        });
    }

    @Override
    public RelationshipCounts countRelationships(UUID callerId) {
        String sql = """
                SELECT
                    COALESCE(SUM(CASE WHEN f.status = 'ACCEPTED' AND p.kind = 'USER' THEN 1 ELSE 0 END), 0) AS accepted_count,
                    COALESCE(SUM(CASE WHEN f.status = 'PENDING' AND f.addressee_id = :callerId AND p.kind = 'USER' THEN 1 ELSE 0 END), 0) AS incoming_count,
                    COALESCE(SUM(CASE WHEN f.status = 'PENDING' AND f.requester_id = :callerId AND p.kind = 'USER' THEN 1 ELSE 0 END), 0) AS outgoing_count,
                    (SELECT COUNT(*) FROM guest_profiles g WHERE g.owner_user_id = :callerId AND g.retired_at IS NULL) AS guest_count
                FROM friendships f
                JOIN participants p
                  ON p.id = CASE WHEN f.requester_id = :callerId THEN f.addressee_id ELSE f.requester_id END
                WHERE f.requester_id = :callerId OR f.addressee_id = :callerId
                """;

        MapSqlParameterSource params = new MapSqlParameterSource("callerId", callerId);
        return jdbcTemplate.queryForObject(sql, params, (rs, rowNum) -> new RelationshipCounts(
                rs.getLong("accepted_count"),
                rs.getLong("incoming_count"),
                rs.getLong("outgoing_count"),
                rs.getLong("guest_count")
        ));
    }

    @Override
    public List<SearchCandidateRow> searchEligibleUsers(
            UUID callerId,
            String escapedLikePattern,
            int friendCap,
            boolean guestsCountTowardFriendCap,
            String cursorSortKey,
            UUID cursorId,
            int limitPlusOne) {

        String capSubquery = guestsCountTowardFriendCap
                ? """
                  (SELECT COUNT(*)
                   FROM friendships f2
                   WHERE (f2.requester_id = u.id OR f2.addressee_id = u.id)
                     AND f2.status IN ('PENDING', 'ACCEPTED')) < :friendCap
                  """
                : """
                  (SELECT COUNT(*)
                   FROM friendships f2
                   JOIN participants p2
                     ON p2.id = CASE WHEN f2.requester_id = u.id THEN f2.addressee_id ELSE f2.requester_id END
                   WHERE (f2.requester_id = u.id OR f2.addressee_id = u.id)
                     AND f2.status IN ('PENDING', 'ACCEPTED')
                     AND p2.kind = 'USER') < :friendCap
                  """;

        StringBuilder sql = new StringBuilder("""
                SELECT u.id,
                       u.name,
                       up.username,
                       up.avatar_id,
                       LOWER(COALESCE(up.username, u.name)) AS sort_key
                FROM users u
                LEFT JOIN user_profiles up ON up.user_id = u.id
                WHERE u.id <> :callerId
                  AND u.status = 'ACTIVE'
                  AND (
                      LOWER(u.name) LIKE :pattern ESCAPE '\\'
                      OR LOWER(COALESCE(up.username, '')) LIKE :pattern ESCAPE '\\'
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM friendships f
                      WHERE (f.requester_id = :callerId AND f.addressee_id = u.id)
                         OR (f.addressee_id = :callerId AND f.requester_id = u.id)
                  )
                  AND
                """).append(capSubquery);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("callerId", callerId)
                .addValue("pattern", escapedLikePattern)
                .addValue("friendCap", friendCap)
                .addValue("limitPlusOne", limitPlusOne);

        if (cursorId != null) {
            sql.append("""
                      AND (
                          LOWER(COALESCE(up.username, u.name)) > :cursorSortKey
                          OR (LOWER(COALESCE(up.username, u.name)) = :cursorSortKey AND u.id > :cursorId)
                      )
                    """);
            params.addValue("cursorSortKey", cursorSortKey != null ? cursorSortKey : "");
            params.addValue("cursorId", cursorId);
        }

        sql.append(" ORDER BY LOWER(COALESCE(up.username, u.name)) ASC, u.id ASC LIMIT :limitPlusOne");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            ParticipantSummaryDto participant = new ParticipantSummaryDto(
                    rs.getObject("id", UUID.class),
                    rs.getString("name"),
                    rs.getString("username"),
                    rs.getString("avatar_id"),
                    false
            );
            return new SearchCandidateRow(participant, rs.getString("sort_key"));
        });
    }
}

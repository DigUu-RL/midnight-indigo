package members

import (
	"context"
	"errors"
	"fmt"
)

type Role string

const (
	RoleOwner  Role = "owner"
	RoleEditor Role = "editor"
	RoleViewer Role = "viewer"
)

var ErrNotFound = errors.New("member not found")

type Member struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  Role   `json:"role"`
}

type Repository interface {
	Find(ctx context.Context, id string) (*Member, error)
	Save(ctx context.Context, m *Member) error
}

// Promote raises a member's role, leaving owners untouched.
func Promote(ctx context.Context, repo Repository, id string, to Role) (*Member, error) {
	m, err := repo.Find(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find %s: %w", id, err)
	}
	if m.Role == RoleOwner && to != RoleOwner {
		return m, nil
	}
	m.Role = to
	return m, repo.Save(ctx, m)
}

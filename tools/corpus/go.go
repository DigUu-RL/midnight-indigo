package corpus

type ID = string

const (
	Low Level = iota
	High
)

type Level int

type Stack[T any] struct {
	items []T
}

type Sizer interface {
	Size() int
}

func (s *Stack[T]) Push(item T) {
	s.items = append(s.items, item)
}

func Map[T, U any](values []T, apply func(T) U) []U {
	out := make([]U, 0, len(values))
	for _, value := range values {
		out = append(out, apply(value))
	}
	return out
}

package battle

import "testing"

func TestFieldContains(t *testing.T) {
	f := Field{Subject: "math", CenterX: 5, CenterZ: 0, Radius: 3}

	cases := []struct {
		name string
		x, z float64
		want bool
	}{
		{"中心は内側", 5, 0, true},
		{"半径ちょうどは内側", 8, 0, true},
		{"半径外は外側", 8.1, 0, false},
		{"斜め方向の外側", 5, 3.1, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := f.Contains(c.x, c.z); got != c.want {
				t.Errorf("Contains(%v,%v)=%v want %v", c.x, c.z, got, c.want)
			}
		})
	}
}

func TestSubjectAt(t *testing.T) {
	fields := []Field{
		{Subject: "math", CenterX: 5, CenterZ: 0, Radius: 3},
		{Subject: "english", CenterX: -5, CenterZ: 0, Radius: 3},
	}

	if got := SubjectAt(fields, 5, 0); got != "math" {
		t.Errorf("math field expected, got %q", got)
	}
	if got := SubjectAt(fields, -5, 0); got != "english" {
		t.Errorf("english field expected, got %q", got)
	}
	if got := SubjectAt(fields, 0, 0); got != "" {
		t.Errorf("neutral expected (empty), got %q", got)
	}
}

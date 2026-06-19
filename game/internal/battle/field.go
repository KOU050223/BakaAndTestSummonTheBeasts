package battle

import "math"

// Field は召喚フィールド（先生中心の円）。内側ではその科目のみ召喚・戦闘できる。
type Field struct {
	Subject string
	CenterX float64
	CenterZ float64
	Radius  float64
}

// Contains は座標 (x, z) がフィールド円の内側にあるかを返す。
func (f Field) Contains(x, z float64) bool {
	dx := x - f.CenterX
	dz := z - f.CenterZ
	return math.Hypot(dx, dz) <= f.Radius
}

// SubjectAt は座標 (x, z) が属するフィールドの科目を返す。
// どのフィールドにも属さない（中立地帯）場合は空文字を返す。
// 複数フィールドに重なる場合は最初に含むフィールドを採用する。
func SubjectAt(fields []Field, x, z float64) string {
	for _, f := range fields {
		if f.Contains(x, z) {
			return f.Subject
		}
	}
	return ""
}

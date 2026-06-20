package wshandler

import "strconv"

// jwtNumberToString は JWT クレームの数値（float64）を整数IDの文字列へ変換する。
func jwtNumberToString(v float64) string {
	return strconv.FormatInt(int64(v), 10)
}

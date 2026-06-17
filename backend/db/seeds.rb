# find_or_create_by! でべき等に実行できる

# -----------------------------------------------
# クラス（いずれも2年生。学年は school_classes.grade で表現する）
# -----------------------------------------------
class_a = SchoolClass.find_or_create_by!(grade: 2, name: "Aクラス")
class_b = SchoolClass.find_or_create_by!(grade: 2, name: "Bクラス")
class_c = SchoolClass.find_or_create_by!(grade: 2, name: "Cクラス")
class_d = SchoolClass.find_or_create_by!(grade: 2, name: "Dクラス")
class_e = SchoolClass.find_or_create_by!(grade: 2, name: "Eクラス")
class_f = SchoolClass.find_or_create_by!(grade: 2, name: "Fクラス")

# -----------------------------------------------
# 教師
# -----------------------------------------------
teacher1 = User.find_or_create_by!(email: "teacher@example.com") do |u|
  u.name     = "文月学"
  u.password = "password"
  u.role     = "teacher"
end
teacher2 = User.find_or_create_by!(email: "tetsujin@example.com") do |u|
  u.name     = "西村宗一"
  u.password = "password"
  u.role    = "teacher"
end

# -----------------------------------------------
# 生徒（Aクラス）
# -----------------------------------------------
student_a1 = User.find_or_create_by!(email: "kirishima@example.com") do |u|
  u.name     = "霧島翔子"
  u.password = "password"
  u.role     = "student"
end

student_a2 = User.find_or_create_by!(email: "sato@example.com") do |u|
  u.name     = "佐藤美穂"
  u.password = "password"
  u.role     = "student"
end

student_a3 = User.find_or_create_by!(email: "kinoshita_yuko@example.com") do |u|
  u.name     = "木下優子"
  u.password = "password"
  u.role     = "student"
end

student_a4 = User.find_or_create_by!(email: "kubo@example.com") do |u|
  u.name     = "久保利光"
  u.password = "password"
  u.role     = "student"
end

student_a5 = User.find_or_create_by!(email: "kudo@example.com") do |u|
  u.name     = "工藤愛子"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Bクラス）
# -----------------------------------------------
student_b1 = User.find_or_create_by!(email: "nemoto@example.com") do |u|
  u.name     = "根本恭二"
  u.password = "password"
  u.role     = "student"
end

student_b2 = User.find_or_create_by!(email: "iwashita@example.com") do |u|
  u.name     = "岩下律子"
  u.password = "password"
  u.role     = "student"
end

student_b3 = User.find_or_create_by!(email: "kikuiri@example.com") do |u|
  u.name     = "菊入真由美"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Cクラス）
# -----------------------------------------------
student_c1 = User.find_or_create_by!(email: "koyama@example.com") do |u|
  u.name     = "小山友香"
  u.password = "password"
  u.role     = "student"
end

student_c2 = User.find_or_create_by!(email: "niino@example.com") do |u|
  u.name     = "新野すみれ"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Dクラス）
# -----------------------------------------------
student_d1 = User.find_or_create_by!(email: "hiraga@example.com") do |u|
  u.name     = "平賀源二"
  u.password = "password"
  u.role     = "student"
end

student_d2 = User.find_or_create_by!(email: "shimizu@example.com") do |u|
  u.name     = "清水美春"
  u.password = "password"
  u.role     = "student"
end

student_d3 = User.find_or_create_by!(email: "tamano@example.com") do |u|
  u.name     = "玉野美紀"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Eクラス）
# -----------------------------------------------
student_e1 = User.find_or_create_by!(email: "nakabayashi@example.com") do |u|
  u.name     = "中林宏美"
  u.password = "password"
  u.role     = "student"
end

student_e2 = User.find_or_create_by!(email: "mikami@example.com") do |u|
  u.name     = "三上美子"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Fクラス）
# -----------------------------------------------
student_f1 = User.find_or_create_by!(email: "yoshii@example.com") do |u|
  u.name     = "吉井明久"
  u.password = "password"
  u.role     = "student"
end

student_f2 = User.find_or_create_by!(email: "tsuchiya@example.com") do |u|
  u.name     = "土屋康太"
  u.password = "password"
  u.role     = "student"
end

student_f3 = User.find_or_create_by!(email: "himeji@example.com") do |u|
  u.name     = "姫路瑞希"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# クラス所属
# -----------------------------------------------
ClassMembership.find_or_create_by!(user: student_a1) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_a2) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_a3) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_a4) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_a5) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_b1) { |m| m.school_class = class_b }
ClassMembership.find_or_create_by!(user: student_b2) { |m| m.school_class = class_b }
ClassMembership.find_or_create_by!(user: student_b3) { |m| m.school_class = class_b }
ClassMembership.find_or_create_by!(user: student_c1) { |m| m.school_class = class_c }
ClassMembership.find_or_create_by!(user: student_c2) { |m| m.school_class = class_c }
ClassMembership.find_or_create_by!(user: student_d1) { |m| m.school_class = class_d }
ClassMembership.find_or_create_by!(user: student_d2) { |m| m.school_class = class_d }
ClassMembership.find_or_create_by!(user: student_d3) { |m| m.school_class = class_d }
ClassMembership.find_or_create_by!(user: student_e1) { |m| m.school_class = class_e }
ClassMembership.find_or_create_by!(user: student_e2) { |m| m.school_class = class_e }
ClassMembership.find_or_create_by!(user: student_f1) { |m| m.school_class = class_f }
ClassMembership.find_or_create_by!(user: student_f2) { |m| m.school_class = class_f }
ClassMembership.find_or_create_by!(user: student_f3) { |m| m.school_class = class_f }

# -----------------------------------------------
# 試験・点数（全クラスの数学・英語）
# 成績順クラス編成（A=最上位 … F=最下位）が伝わるよう、上位クラスほど高得点にする。
# クラスごとに基準点を置き、生徒順に少しずつ点をずらして個人差を出す。
# -----------------------------------------------
class_base_scores = {
  class_a => 92,
  class_b => 80,
  class_c => 68,
  class_d => 55,
  class_e => 44,
  class_f => 35
}

# クラス所属はメンバーシップから引く（生徒変数の重複列挙を避ける）。
class_base_scores.each do |school_class, base|
  exam_math = Exam.find_or_create_by!(title: "#{school_class.name} 数学 小テスト1", subject: "math", school_class: school_class) do |e|
    e.created_by = teacher1
    e.max_score  = 100
  end
  exam_english = Exam.find_or_create_by!(title: "#{school_class.name} 英語 小テスト1", subject: "english", school_class: school_class) do |e|
    e.created_by = teacher2
    e.max_score  = 100
  end

  school_class.students.order(:id).each_with_index do |student, i|
    # 生徒ごとに -4〜+4 程度ずらし、数学と英語でも少し差をつける（0〜100 にクランプ）。
    math_score    = (base + (i * 3) - 4).clamp(0, 100)
    english_score = (base - (i * 2) + 2).clamp(0, 100)
    Score.find_or_create_by!(exam: exam_math, student: student) { |s| s.score = math_score }
    Score.find_or_create_by!(exam: exam_english, student: student) { |s| s.score = english_score }
  end
end

# -----------------------------------------------
# 召喚獣ステータス（Summon::Recalculate で計算式を一元化）
# Score#after_save でも再計算されるが、再シード時に最新の計算式を確実に反映するため明示的に呼ぶ。
# -----------------------------------------------
User.where(role: "student").find_each do |student|
  %w[math english].each do |subject|
    Summon::Recalculate.call(student: student, subject: subject)
  end
end

puts "Seed完了:"
puts "  クラス: #{SchoolClass.count}"
puts "  ユーザー: #{User.count} (教師: #{User.where(role: 'teacher').count}, 生徒: #{User.where(role: 'student').count})"
puts "  試験: #{Exam.count}"
puts "  点数: #{Score.count}"
puts "  召喚獣ステータス: #{SummonStatus.count}"

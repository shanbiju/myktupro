const row = `onclick="javascript:viewMarkPopup('#viewMarkForFailedCourses','Y+n1ZvhwxjodwBc41N5Q1zjOSfxmqf0HkYRQyxUatp8=','j/ZmlGKeEtp8PJVtSou6sHqC1HwCqZ1cJLTypNjC8qg=','XJdEuoMTvmXrZvBRbnxwXoDFmNuRh0hHS0/CHGUBwPg=','T8O+EEiGMzM+Q4KfUkX8wreQZnNJY61xoEbTTxKf2CQ=','5ToBL0R53TZx/Pjar66wurSWJeCjv4z55p+6q5icSSA=','/H812ILF3kqAAFHB8ndzpg0+1AnYH7goptTaDbZ7V5k=','nImQuC7UAAQkdsULCPsmVwWJGeT3bf3Jpyh3aIKQAB4=','', '2');"`;

const onclickMatch = row.match(/viewMarkPopup\s*\(\s*['"]#viewMarkForFailedCourses['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]/i);

console.log("Match:", !!onclickMatch);
if (onclickMatch) {
  for (let i = 0; i < onclickMatch.length; i++) {
    console.log(`${i}: ${onclickMatch[i]}`);
  }
}

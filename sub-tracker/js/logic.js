// 구독 데이터(subscription) 예시
//{
//  "id": "sub_1",
//  "name": "넷플릭스",
//  "amount": 13500,
//  "cycle": "monthly", //"monthly" 또는 "yearly"//  
//  "nextPaymentDate": "2024-06-15"
//  "category": "영상",
//  "paymentMethod": "카드",
//}

// 구독 1건을 받아 월 기준 금액으로 환산해 반환한다.
// cycle "yearly"이면 12로 나누고, 원 단위로 반올림한다.
function convertToMonthly(subscription) {
  if (subscription.cycle === "monthly") {
    return subscription.amount;
  } else if (subscription.cycle === "yearly") {
    return Math.round(subscription.amount / 12);
  } else {
    throw new Error("Invalid cycle type");
  }
}  

// 구독 데이터 배열을 받아 월 기준 금액으로 환산한 총합을 반환한다.
function calculateTotalMonthly(subscriptions) {
  return subscriptions.reduce((total, subscription) => {
    return total + convertToMonthly(subscription);
  }, 0);
}

// 구독 데이터 배열을 받아 연간 지출 합계를 반환한다.
// 월 합계에 12를 곱하여 연간 지출을 계산한다.
function calculateTotalYearly(subscriptions) {
  const totalMonthly = calculateTotalMonthly(subscriptions);
  return totalMonthly * 12;
}

// 오늘 날짜와 구독의 다음 결제일을 비교하여 남은 일수를 계산한다.
// 두 값 모두 "YYYY-MM-DD" 형식의 문자열이어야 한다.
// 시각 정보는 무시하고 날짜만 비교한다.
// 오늘이면 0, 지난 날짜면 음수, 미래 날짜면 양수를 반환한다.
function calculateDaysUntilNextPayment(nextPaymentDate) {
  const today = new Date();
  const nextPayment = new Date(nextPaymentDate);
  const diffTime = nextPayment - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 결제일이 N일 이내인 구독만 필터링하여 반환한다.
// 지난 것은 제외하고, 오늘 결제일인 것도 포함하지 않는다.
function filterSubscriptionsByNextPayment(subscriptions, days) {
  return subscriptions.filter(subscription => {
    const daysUntilNextPayment = calculateDaysUntilNextPayment(subscription.nextPaymentDate);
    return daysUntilNextPayment > 0 && daysUntilNextPayment <= days;
  });
}

// 카테고리 별로 묶어 { 카테고리 : 월합계 } 형태로 반환한다.
// {"영상": 13500, "음악": 10000, ...} 형태로 반환
function groupSubscriptionsByCategory(subscriptions) {
  return subscriptions.reduce((result, subscription) => {
    const monthlyAmount = convertToMonthly(subscription);
    if (result[subscription.category]) {
      result[subscription.category] += monthlyAmount;
    } else {
      result[subscription.category] = monthlyAmount;
    }
    return result;
  }, {});
}

// 카드 별 월 합계를 계산하여 { 카드명 : 월합계 } 형태로 반환한다.
// {"삼성카드": 55900, "애플페이": 23500} 형태로 반환
function groupSubscriptionsByPaymentMethod(subscriptions) {
  return subscriptions.reduce((result, subscription) => {
    const monthlyAmount = convertToMonthly(subscription);
    if (result[subscription.paymentMethod]) {
      result[subscription.paymentMethod] += monthlyAmount;
    } else {
      result[subscription.paymentMethod] = monthlyAmount;
    }
    return result;
  }, {});
}

const testData = [
 {name:"넷플릭스",  amount:13500, cycle:"monthly",
  nextPaymentDate:"2026-08-16", category:"영상", paymentMethod:"애플페이"},
 {name:"스포티파이",amount:10900, cycle:"monthly",
  nextPaymentDate:"2026-08-20", category:"음악", paymentMethod:"삼성카드"},
 {name:"헬스장",    amount:45000, cycle:"monthly",
  nextPaymentDate:"2026-09-01", category:"운동", paymentMethod:"삼성카드"},
 {name:"클라우드",  amount:120000,cycle:"yearly",
  nextPaymentDate:"2027-02-01", category:"생산성", paymentMethod:"애플페이"}
];


console.log("월 합계:", calculateTotalMonthly(testData)); 
// 월 합계: 13500 + 10900 + 45000 + (120000/12) = 13500 + 10900 + 45000 + 10000 = 79400
console.log("연 합계:", calculateTotalYearly(testData)); 
console.log("카테고리별(월):", groupSubscriptionsByCategory(testData));
console.log("카드별(월):", groupSubscriptionsByPaymentMethod(testData));

// 
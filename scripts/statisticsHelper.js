import {
  acTable,
  attributeTable,
  hpTable,
  rangeOptions,
  savingThrowPerceptionTable,
  skillTable,
  weaknessTable,
} from "./statisticsData.js";

export const getCategoryLabel = (statisticsTable, level, save, short) => {
  if (save === undefined || save === null) return save;

  const { range, values } = statisticsTable;
  const tableRow = values[level];

  if (save > tableRow[range[0]])
    return getCategoryLabelValue(range, "extreme", short);
  if (save < tableRow[range[range.length - 1]])
    return getCategoryLabelValue(range, "terrible", short);

  var value = null;
  for (var category in tableRow) {
    const rowValue = tableRow[category];
    if (!value || Math.abs(rowValue - save) < value.diff) {
      value = {
        category: category,
        diff: Math.abs(rowValue - save),
      };
    }
  }

  return getCategoryLabelValue(range, value.category, short);
};

export const setSimpleCategoryLabels = (saves) => {
  const range = ["high", "moderate", "low"];
  const workingSaves = Object.keys(saves)
    .map((key) => ({ key: key, value: saves[key].value }))
    .sort((a, b) => b.value - a.value);
  for (var i = 0; i < workingSaves.length; i++) {
    const baseCategory = i === 0 ? "high" : i === 1 ? "moderate" : "low";
    const save = workingSaves[i];
    if (i !== 0 && workingSaves[i - 1].value === save.value) {
      saves[save.key].category = saves[workingSaves[i - 1].key].category;
    } else {
      saves[save.key].category = getCategoryLabelValue(
        range,
        baseCategory,
        true,
      );
    }
  }
};

export const getMixedCategoryLabel = (statisticsTable, level, save, short) => {
  const { range, values } = statisticsTable;
  const tableRow = values[level];

  const maxCategory = tableRow[range[0]];
  const minCategory = tableRow[range[range.length - 1]];
  if (value > (maxCategory.high ?? maxCategory))
    return getCategoryLabelValue(range, "extreme");
  if (value < (minCategory.low ?? minCategory))
    return getCategoryLabelValue(range, "terrible");

  var value = null;
  for (var category in tableRow) {
    const rowValue = tableRow[category]?.high
      ? Math.min(
          Math.abs(tableRow[category].high - save),
          Math.abs(tableRow[category].low - save),
        )
      : Math.abs(tableRow[category] - save);
    if (!value || rowValue < value.diff) {
      value = {
        category: category,
        diff: rowValue,
      };
    }
  }

  return getCategoryLabelValue(range, value.category, short);
};

export const getCategoryFromIntervals = (intervalTable, level, value) => {
  const { range, values } = intervalTable;
  const tableRow = values[level];

  if (value > tableRow[range[0]].high)
    return getCategoryLabelValue(range, "extreme");
  if (value < tableRow[range[range.length - 1]].low)
    return getCategoryLabelValue(range, "terrible");

  return getCategoryLabelValue(
    range,
    Object.keys(tableRow).find(
      (x) => value <= tableRow[x].high && value >= tableRow[x].low,
    ),
  );
};

const derivedWeaknessTable = Object.keys(weaknessTable).reduce((acc, key) => {
  const baseValues = weaknessTable[key];
  acc[key] = {
    ...baseValues,
    moderate: Math.floor(
      baseValues.low + (baseValues.high - baseValues.low) / 2,
    ),
  };

  return acc;
}, {});

export const getIWRCategoryIcon = (level, value) => {
  const tableRow = derivedWeaknessTable[level];
  if (value > tableRow.high) return "fa-solid fa-angles-up";
  if (value < tableRow.low) return "fa-solid fa-angle-up";

  var tempValue = null;
  for (var category in tableRow) {
    const rowValue = tableRow[category];
    if (!tempValue || Math.abs(rowValue - value) <= tempValue.diff) {
      tempValue = {
        category: category,
        diff: Math.abs(rowValue - value),
      };
    }
  }

  return tempValue.category === "high"
    ? "fa-solid fa-angles-up"
    : "fa-solid fa-angle-up";
};

const getCategoryLabelValue = (range, category, short) => {
  while (!range.find((x) => x === category)) {
    const currentIndex = rangeOptions.indexOf(category);

    if (currentIndex > range.length - 1)
      category = rangeOptions[currentIndex - 1];
    else category = rangeOptions[currentIndex + 1];
  }

  const { vagueDescriptions } = game.settings.get(
    "pf2e-bestiary-tracking",
    "bestiary-labels",
  );
  switch (category) {
    case "extreme":
      return short
        ? vagueDescriptions.short.extreme
        : vagueDescriptions.full.extreme;
    case "high":
      return short ? vagueDescriptions.short.high : vagueDescriptions.full.high;
    case "moderate":
      return short
        ? vagueDescriptions.short.moderate
        : vagueDescriptions.full.moderate;
    case "low":
      return short ? vagueDescriptions.short.low : vagueDescriptions.full.low;
    case "terrible":
      return short
        ? vagueDescriptions.short.terrible
        : vagueDescriptions.full.terrible;
  }
};

const getCategoryClass = (category) => {
  switch (category) {
    case "extreme":
    case "high":
      return "category-high";
    case "moderate":
      return "category-medium";
    case "low":
    case "terrible":
      return "category-low";
  }
};

export const getCategoryRange = async (name) => {
  const { vagueDescriptions } = await game.settings.get(
    "pf2e-bestiary-tracking",
    "bestiary-labels",
  );

  switch (name) {
    case "ac":
      return acTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.full[category]),
      );
    case "hp":
      return hpTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.full[category]),
      );
    case "attributes":
      return attributeTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.short[category]),
      );
    case "saves":
      return savingThrowPerceptionTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.short[category]),
      );
    case "perception":
      return savingThrowPerceptionTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.full[category]),
      );
    case "skills":
      return skillTable.range.map((category) =>
        game.i18n.localize(vagueDescriptions.full[category]),
      );
  }
};

export const getRollAverage = (terms) => {
  var total = 0;
  var currentOperator = null;
  for (var i = 0; i < terms.length; i++) {
    var term = terms[i];

    //Pool, string and function terms should not be applicable to damage rolls in pf2e
    if (term.operator) {
      currentOperator = term.operator;
    } else if (term.faces) {
      total = applyRollOperator(
        total,
        currentOperator,
        getDiceAverage(term.faces, term.number),
      );
    } else if (term.number) {
      total = applyRollOperator(total, currentOperator, term.number);
    } else if (term.terms) {
      total = applyRollOperator(
        total,
        currentOperator,
        getRollAverage(term.terms),
      );
    }
  }

  return total;
};

const applyRollOperator = (total, operator, value) => {
  switch (operator) {
    case "+":
      return total + value;
    case "-":
      return total - value;
    case "/":
      return total / value;
    case "*":
      return total * value;
    default:
      return value;
  }
};

const getDiceAverage = (faces, number) => {
  var oddDice = 0,
    pairs = 0;
  switch (faces) {
    case 10:
      if (number === 1) return 6;
    case 12:
      if (number === 1) return 7;
    default:
      oddDice = number % 2;
      pairs = (number - oddDice) / 2;
      return pairs * (faces / 2 + (faces / 2 + 1)) + (oddDice ? faces / 2 : 0);
  }
};

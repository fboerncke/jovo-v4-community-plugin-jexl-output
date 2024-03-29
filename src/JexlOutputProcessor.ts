import JEXL from "jexl";
import Voca from "voca";

/**
 * Starting with a text string which contains "Jexl" expressions (described in
 * detail here: https://github.com/TomFrost/Jexl) this processor will iterate
 * and evaluate each expression.
 *
 * The evaluated expressions are then used to replace their Jexl originals.
 *
 * Examples and possible outcome:
 *
 * Input string "Your lucky number is ${1+Math.floor(Math.random()*10)}"
 *
 * Possible output: "Your lucky number is 7"
 *
 * @param text some string that may contain Jexl expressions
 * @param jexlContext some context which is used when evaluating an Jexl expresson
 * @returns original string with all expressions evaluated
 *
 */
export function processJexlExpression(text: string, jexlContext: any): string {
  Object.getOwnPropertyNames(Math).forEach((functionName) => {
    // @ts-ignore
    JEXL.addFunction(functionName, Math[functionName as keyof typeof Math]);
  });

  Object.getOwnPropertyNames(Voca).forEach((functionName) => {
    // @ts-ignore
    JEXL.addFunction(functionName, Voca[functionName as keyof typeof Voca]);
  });

  JEXL.addFunction(
    "join",
    (array: string[], joinString: string, lastJoinString: string): string => {
      if (array === undefined || !Array.isArray(array)) {
        // Parameter for join is no array
        return "";
      }
      const length = array.length;

      if (joinString === undefined) {
        joinString = ",";
      }
      if (lastJoinString === undefined) {
        lastJoinString = joinString;
      }

      if (length === 0) {
        return "";
      } else if (length === 1) {
        return array[0];
      } else if (length === 2) {
        return array.join(lastJoinString);
      } else {
        // length >= 3
        const allButLast = array.slice(0, length - 1);
        const lastElement = array[length - 1];
        return allButLast.join(joinString) + lastJoinString + lastElement;
      }
    }
  );

  let newText = text;
  const regEx = new RegExp(/\${(.+?)}/g);
  let matches = regEx.exec(text);
  while (matches !== null) {
    // matches[0] = ${4+4}
    // matches[1] = 4+4
    const result = JEXL.evalSync(matches[1], jexlContext);
    newText = newText.replace(matches[0], result);
    matches = regEx.exec(text);
  }
  return newText;
}

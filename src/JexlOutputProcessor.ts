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

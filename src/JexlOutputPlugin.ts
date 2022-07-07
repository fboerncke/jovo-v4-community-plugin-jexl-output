import {
  Jovo,
  HandleRequest,
  Plugin,
  PluginConfig,
  Extensible,
  InvalidParentError,
  MessageValue,
} from "@jovotech/framework";

import { processJexlExpression } from "./JexlOutputProcessor";

/**
 * This plugin will search and process the output object for
 * 'message' and 'reprompt' entries in case they contain
 * 'Jexl' expressions (https://www.npmjs.com/package/jexl).
 */
export class JexlOutputPlugin extends Plugin {
  mount(extensible: Extensible) {
    if (!(extensible instanceof HandleRequest)) {
      throw new InvalidParentError(this.constructor.name, HandleRequest);
    }
    extensible.middlewareCollection.use(
      "before.response.output",
      (jovo: Jovo) => {
        this.processJexlExpressionsInOutput(jovo);
      }
    );
  }

  processJexlExpressionsInOutput(jovo: Jovo) {
    const jexlContext = {
      // $processEnv: process.env,
      $component: jovo.$component,
      $data: jovo.$data,
      $device: jovo.$device,
      $entities: jovo.$entities,
      $input: jovo.$input,
      $request: jovo.$request,
      $route: jovo.$route,
      $session: jovo.$session,
      $state: jovo.$state,
      $user: jovo.$user,
      $platform: jovo.$platform,
    };

    jovo.$output.forEach((entry) => {
      if ("message" in entry) {
        if (Array.isArray(entry.message)) {
          let messageArray = entry.message;
          messageArray = messageArray.map((message: MessageValue) => {
            return this.processOutputElementIncludingJexl(message, jexlContext);
          });
          entry.message = messageArray;
        } else {
          entry.message = this.processOutputElementIncludingJexl(
            entry.message as string,
            jexlContext
          );
        }
      }

      if ("reprompt" in entry) {
        if (Array.isArray(entry.reprompt)) {
          let repromptArray = entry.reprompt;
          repromptArray = repromptArray.map((message: MessageValue) => {
            return this.processOutputElementIncludingJexl(message, jexlContext);
          });
          entry.reprompt = repromptArray;
        } else {
          entry.reprompt = this.processOutputElementIncludingJexl(
            entry.reprompt as string,
            jexlContext
          );
        }
      }
    });
  }

  /**
   *
   * @param outputElementIncludingJexl may be a string or an object like {text: string, speech: string} but no Array
   * @returns
   */
  processOutputElementIncludingJexl(
    outputElementIncludingJexl: MessageValue,
    jexlContext: any
  ): MessageValue {
    if (typeof outputElementIncludingJexl === "string") {
      outputElementIncludingJexl = processJexlExpression(
        outputElementIncludingJexl as string,
        jexlContext
      );
    } else if (typeof outputElementIncludingJexl === "object") {
      // structure is something like {text: string, speech: string}
      if ("text" in outputElementIncludingJexl) {
        outputElementIncludingJexl.text = processJexlExpression(
          outputElementIncludingJexl.text as string,
          jexlContext
        );
      }
      if ("speech" in outputElementIncludingJexl) {
        outputElementIncludingJexl.speech = processJexlExpression(
          outputElementIncludingJexl.speech as string,
          jexlContext
        );
      }
    }
    return outputElementIncludingJexl;
  }

  getDefaultConfig(): PluginConfig {
    return {};
  }
}

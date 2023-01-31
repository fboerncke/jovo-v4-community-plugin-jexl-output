import {
  Jovo,
  HandleRequest,
  Plugin,
  PluginConfig,
  Extensible,
  InvalidParentError,
  MessageValue,
  QuickReplyValue,
} from "@jovotech/framework";

import * as _ from "lodash";

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

      if ("quickReplies" in entry) {
        const regEx = new RegExp(/^\${(.+?)}$/);
        if (
          regEx.test(entry.quickReplies as unknown as string) &&
          entry.quickReplies !== undefined &&
          entry.quickReplies.length > 0
        ) {
          // something like "${some.path.notation.and.nothing.around}"
          const expression = entry.quickReplies[0] as unknown as string;
          const keypath = expression.slice(2, expression.length - 1); // ${a.b.c} ==> a.b.c

          const result = _.get(jovo, keypath);
          entry.quickReplies = result;
        }

        if (Array.isArray(entry.quickReplies)) {
          let quickRepliesArray = entry.quickReplies;
          quickRepliesArray = quickRepliesArray.map(
            (message: QuickReplyValue): QuickReplyValue => {
              return this.processQuickReplyValueIncludingJexl(
                message,
                jexlContext
              );
            }
          );
          entry.quickReplies = quickRepliesArray;
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

  /**
   *
   * @param quickReplyValueIncludingJexl may be a string or an object like {text: string, speech: string} but no Array
   * @returns
   */
  processQuickReplyValueIncludingJexl(
    quickReplyValueIncludingJexl: QuickReplyValue,
    jexlContext: any
  ): QuickReplyValue {
    quickReplyValueIncludingJexl = processJexlExpression(
      quickReplyValueIncludingJexl as string,
      jexlContext
    );
    return quickReplyValueIncludingJexl;
  }

  getDefaultConfig(): PluginConfig {
    return {};
  }
}

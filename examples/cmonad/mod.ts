import { Args, parse } from "./deps/deno/flags.ts";

import { IO, io } from "../../runner/io.ts";
import { Either, isEither, match, right, wrap } from "../../data/either.ts";
import { isMatchable } from "../../base/matchable.ts";
import { identity } from "../../internal/pure.ts";
import { create, merge as mergeObjects } from "../../internal/object.ts";

export interface Runnable {
  readonly main: MainCommand;
  readonly rawArgs: Readonly<string[]>;
  readonly parsedArgs: Args;
}

export interface Command {
  readonly name: string;
  readonly action?: (args: Args) => void;
  readonly handleMissing: boolean;
  readonly subcommands?: Readonly<Command[]>;
  readonly options?: Readonly<Option[]>;
}
export type MainCommand = Command & Required<Pick<Command, "action">>;

export interface Option {
  readonly name: `--${string}`;
  readonly configuration: OptionConfiguration;
}
export interface OptionConfiguration {
  readonly collect: boolean;
  readonly forceString: boolean;
  readonly negatable: boolean;
  readonly defaultVal: unknown;
  readonly aliases: Readonly<`-${string}`[]>;
}

export function command(
  name: string,
  action: (args: Args) => void,
  handleMissing = false,
): IO<Pick<Runnable, "main">> {
  return io(() => create({ main: create({ name, action, handleMissing }) }));
}

export function subcommand(
  name: string,
  action?: (args: Args) => void,
  handleMissing = false,
) {
  return function (
    runnable: Pick<Runnable, "main">,
  ): IO<Pick<Runnable, "main">> {
    return io(() => {
      const { main } = runnable;
      const { subcommands, ...rest } = main;
      mergeObjects(runnable, {
        main: mergeObjects(main, {
          subcommands: Object.freeze([
            ...(subcommands ?? []),
            create({ name, action, handleMissing }),
          ]),
        }),
      });
      return create({
        main: create({
          ...rest,
          subcommands: Object.freeze([
            ...(subcommands ?? []),
            Object.freeze({ name, action, handleMissing }),
          ]),
        }),
      });
    });
  };
}

export const defaultOptionConfiguration: OptionConfiguration = {
  collect: false,
  forceString: false,
  negatable: false,
  defaultVal: false,
  aliases: [],
};
export function option(
  name: `--${string}`,
  configuration: Partial<OptionConfiguration> = defaultOptionConfiguration,
) {
  return function (
    { main }: Pick<Runnable, "main">,
  ): IO<Pick<Runnable, "main">> {
    return io(() => {
      const { options, ...rest } = main;
      return create({
        main: create({
          ...rest,
          options: Object.freeze([
            ...(options ?? []),
            Object.freeze({
              name,
              configuration: {
                ...defaultOptionConfiguration,
                ...configuration,
              },
            }),
          ]),
        }),
      });
    });
  };
}

interface Parsed {
  readonly rawArgs: Readonly<string[]>;
  readonly main: Command;
}

export function parseArgs({ main }: Pick<Runnable, "main">): IO<Runnable> {
  return io((w) => {
    return create({
      main,
      rawArgs: w.Deno.args,
      parsedArgs: parse(w.Deno.args),
    });
  });
}

export function chooseCommand(runnable: Runnable) {
  return io<Either<Error, Parsed>>(() => {
    return wrap(() => {
      const { _: commandList } = runnable.parsedArgs;

      let choosen: Command = runnable.main;
      for (const commandName in commandList) {
        if (!choosen) throw new Error("invalid command");
        const maybe = choosen.subcommands?.find((c) => c.name === commandName);
        if (maybe) choosen = maybe;
      }

      return create({ ...runnable });
    });
  });
}

export function handleError<T>(x: Either<Error, T>) {
  return io((w) => {
    return match(x, (err) => w.console.error(err), identity);
  });
}

export function debug(msg?: unknown) {
  return function <T>(data: T): IO<T> {
    return io<T>((w) => {
      if (msg) w.console.group(msg);
      w.console.dir(data);
      if (msg) w.console.groupEnd();
      return data;
    });
  };
}

command("greeter", console.log.bind(console))
  .bind(option("--help", { aliases: ["-h"] }))
  .bind(debug("added help"))
  .bind(chooseCommand)
  .bind(handleError)
  .bind(debug("parsed args"))
  .run(globalThis);

declare type Describe = { title: string; callback: function };

declare function describe(title: string, callback: function);

declare type Test = { title: string; callback: function };
declare function test(title: string, callback: function);
declare function it(title: string, callback: function);

declare type Expect = import("./modules/Expect.js").Expect;

declare function expect(value: any): Expect;

declare type TestConfig = {
  maxUnitTestDuration: number;
  maxSimultaneousRunningTest: number;
  foldersToBeIgnored: string[];
  port?: string
};

declare type UnitTestWsMessage =
  | {
    command: 'runUnit'
    data: string
  }
  | {
    command: 'result'
    data: UnitTestWebsocketNode[]
  }

declare type UnitTestWebsocketNode =
  | {
    type: 'describe',
    title: string
  }
  | {
    type: 'end_describe',
  }
  | {
    type: 'test',
    title: string
    result?: {
      success: boolean,
      time: number,
      console: string,
      error: string
    }
  }

import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildsFetchStartedActionCreator;
  let buildsReceivedActionCreator;
  let buildRestartedActionCreator;
  let fetchBuilds;
  let restartBuild;

  beforeEach(() => {
    dispatch = spy();
    buildsFetchStartedActionCreator = stub()
    buildsReceivedActionCreator = stub()
    buildRestartedActionCreator = stub();

    fetchBuilds = stub()
    restartBuild = stub();

    fixture = proxyquire("../../../frontend/actions/buildActions", {
      "./actionCreators/buildActions": {
        buildsFetchStarted: buildsFetchStartedActionCreator,
        buildsReceived: buildsReceivedActionCreator,
        buildRestarted: buildRestartedActionCreator,
      },
      "../util/federalistApi": {
        fetchBuilds: fetchBuilds,
        restartBuild: restartBuild,
      },
      "../store": {
        dispatch: dispatch,
      }
    }).default;
  });

  it("fetchBuilds", done => {
    const site = { id: "🎫" }
    const builds = ["🔧", "🔨", "⛏"]
    const buildsPromise = Promise.resolve(builds)
    const startedAction = { action: "🚦" }
    const receivedAction = { action: "🏁" }

    fetchBuilds.withArgs(site).returns(buildsPromise)
    buildsFetchStartedActionCreator.withArgs().returns(startedAction)
    buildsReceivedActionCreator.withArgs(builds).returns(receivedAction)

    const actual = fixture.fetchBuilds(site)

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true
      expect(dispatch.calledWith(startedAction)).to.be.true
      expect(dispatch.calledWith(receivedAction)).to.be.true
      done()
    })
  })

  it("restartBuild", done => {
    const build = {
      "we": "like to build it's true",
      "how": "about you?"
    };
    const buildPromise = Promise.resolve(build);
    const action = {
      action: "action"
    };
    restartBuild.withArgs().returns(buildPromise);
    buildRestartedActionCreator.withArgs(build).returns(action);

    const actual = fixture.restartBuild();

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(action)).to.be.true;
      done()
    });
  });
});

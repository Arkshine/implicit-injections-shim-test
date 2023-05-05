import TopicTrackingState, {
  startTracking,
} from "discourse/models/topic-tracking-state";
import DiscourseLocation from "discourse/lib/discourse-location";
import Session from "discourse/models/session";
import Site from "discourse/models/site";
import User from "discourse/models/user";

import { registerDiscourseImplicitInjections } from "../lib/implicit-injections";

function applyOverride() {
  require("discourse/pre-initializers/inject-discourse-objects").default.initialize =
    function (app) {
      const container = app.__container__;
      const siteSettings = container.lookup("service:site-settings");

      const currentUser = User.current();

      // We can't use a 'real' service factory (i.e. services/current-user.js) because we need
      // to register a null value for anon
      app.register("service:current-user", currentUser, { instantiate: false });

      this.topicTrackingState = TopicTrackingState.create({
        messageBus: container.lookup("service:message-bus"),
        siteSettings,
        currentUser,
      });

      app.register("service:topic-tracking-state", this.topicTrackingState, {
        instantiate: false,
      });

      const site = Site.current();
      app.register("service:site", site, { instantiate: false });

      const session = Session.current();
      app.register("service:session", session, { instantiate: false });

      app.register("location:discourse-location", DiscourseLocation);

      registerDiscourseImplicitInjections();

      startTracking(this.topicTrackingState);
    };
}

export default {
  name: "hack-inject-discourse-objects",
  before: "inject-discourse-objects",
  initialize() {
    applyOverride();
  },
};

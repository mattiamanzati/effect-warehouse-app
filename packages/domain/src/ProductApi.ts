import { HttpApiEndpoint } from "@effect/platform"
import * as Schema from "effect/Schema"

HttpApiEndpoint.post("test", "/test").addError(Schema.Never)

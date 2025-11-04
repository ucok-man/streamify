package validator

import (
	z "github.com/Oudwins/zog"
)

var configSchema = z.Struct(z.Schema{
	"Port": z.Int().Required().LT(65535, z.Message("Port must be at most 65535")),
	"Env":  z.String().Required().OneOf([]string{"development", "staging", "production"}),
	"Log": z.Struct(z.Schema{
		"level": z.String().Required().OneOf([]string{"trace", "debug", "info", "warn", "error", "fatal", "panic"}),
	}),
	"Cors": z.Struct(z.Schema{
		"Origins": z.Slice(z.String().Required().URL(z.Message("Each origins item must be valid url"))).Optional(),
	}),
	"DB": z.Struct(z.Schema{
		"MongoURI":      z.String().Required(),
		"DatabaseName":  z.String().Required(),
		"MaxConnecting": Uint64().Required().GT(0, z.Message("Must be positive greater than 0")).LT(100, z.Message("Must be less than 100")),
		"MaxPoolSize":   Uint64().GT(0, z.Message("Must be positive greater than 0")).LT(100, z.Message("Must be less than 100")),
		"MaxIdleTime":   Duration(),
	}),
	"GetStreamIO": z.Struct(z.Schema{
		"ApiKey":    z.String().Required(),
		"ApiSecret": z.String().Required(),
	}),
	"JWT": z.Struct(z.Schema{
		"AuthSecret": z.String().Required(),
	}),
})


# 0.5.10

- expression transform functions ${:!edUl;model...}

# 0.5.9

- declare functions and variables available for expressions using $ngine.settins.env = { ... }

# 0.5.0

- $ngine.navigate appends model to hashbang
- ngine.json whitelist target override option

# 0.4.0

- optional ngine.json configuration, defines global settings & resource whitelist with local setting overrides and optional models
- $ngine.render and $ngine.navigate falls back to render result in 'body' if no other targets are defined

# 0.3.0

- $ngine.settings.disableCache = true|false
- $ngine.version available in template rendering via "_ngine_version_"
- keep list of build versions in file "versions"

# 0.2.0

- semantic versioning, available via "$ngine.version"
- flatten template string literals for compatability
- parse model data as JSON if content-type = application/json, otherwise set model to string content 

# 0.1.0

- cross browser implementation of embedded expressions "${..}"
- cache template & model instances, reload and apply on request "$ngine.reload('${_ngine_template_instance_id_}')"

# 0.0.0

- based on ES2015 template literals and embedded expressions

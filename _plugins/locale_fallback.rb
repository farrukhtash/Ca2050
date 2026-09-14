# Per-field locale fallback for _data/<locale>/*.yml.
#
# Why this exists: templates used to do a whole-object fallback —
#   {% assign sd = site.data[L].feedback | default: site.data[D].feedback %}
# — which only kicks in when site.data[L].feedback is entirely nil. The
# moment a locale file gains a single key, that filter stops firing and
# every *other* field in that file renders blank, making gradual
# translation impossible (a locale file was either fully empty or fully
# translated, nothing in between).
#
# This generator runs once, right after Jekyll loads _data and before any
# page is rendered. For every non-default locale it walks site.data[locale]
# together with site.data[default_lang] and recursively merges them:
#   - Hash:   merge key by key (union of keys from both sides).
#   - Array:  use the locale's array only if it's non-empty; otherwise use
#             the default locale's array. Arrays are swapped as a whole,
#             never merged element-by-element (there's no reliable, generic
#             way to match "the same" item across two independently-edited
#             lists), but each side of the swap is itself the result of the
#             recursive merge, so this still resolves correctly no matter
#             how deep the array sits inside nested objects.
#   - Scalar: use the locale's value unless it's nil or an empty string,
#             in which case fall back to the default locale's value.
#
# After this runs, site.data[locale][key] is never nil for any key that
# exists under site.data[default_lang] — so the old `| default: ...` guards
# already in templates simply stop triggering (harmless) rather than
# needing to be ripped out everywhere.
module LocaleFallback
  class Generator < Jekyll::Generator
    priority :low

    def generate(site)
      languages = site.config["languages"]
      default_lang = site.config["default_lang"]
      return unless languages.is_a?(Array) && default_lang

      default_data = site.data[default_lang]
      return unless default_data.is_a?(Hash)

      languages.each do |lang|
        next if lang == default_lang

        site.data[lang] = merge(site.data[lang], default_data)
      end
    end

    private

    # Recursively fills in `value` (locale-specific data) with pieces of
    # `default` (uz data) wherever the locale is missing/empty, keeping the
    # locale's own content everywhere it has actually been provided.
    def merge(value, default)
      case default
      when Hash
        value = {} unless value.is_a?(Hash)
        result = {}
        (default.keys | value.keys).each do |key|
          result[key] = merge(value[key], default[key])
        end
        result
      when Array
        value.is_a?(Array) && !value.empty? ? value : default
      else
        value.nil? || value == "" ? default : value
      end
    end
  end
end

; Indentation rules for Monad, written for Zed's indent queries.
; Node names track tree-sitter-monad (see the grammar pinned in
; extension.toml); brace-delimited bodies indent one level, their closing
; tokens outdent.

[
  (def)
  (class)
  (struct)
  (instance)
  (type_decl)
  (defmacro)
  (do)
  (decls_block)
  (match_term)
  (param_block)
] @indent

[
  "}"
  "]"
] @outdent

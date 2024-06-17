#!/usr/bin/env python3

import argparse
import os
import re

CORD_SDK_PACKAGE = '@cord-sdk'
CORD_SDK_PATH = 'opensource/sdk-js/packages'

DIRS = ['common', 'database', 'docs', 'external', 'opensource/sdk-js', 'ops', 'repl', 'scripts', 'sdk', 'server']

IMPORT_RE = re.compile(r"from '((%s|%s|\.\.?)/.*?)'" % ("|".join(DIRS), CORD_SDK_PACKAGE))

NAMESPACE_TO_DEFAULT_IMPORTS = ["pg"]

ADD_DEFAULT_FUNCTIONS = [
  "Ajv",
  "addFormat",
  "isJWT",
  "isUUID",
  "Redis",
]

BASIC_REPLACEMENTS = {
  re.compile(r"import (.*) = require\('(.*?)'\)") : r"import \1 from '\2'",
  re.compile(r"\b(%s)\(" % "|".join(ADD_DEFAULT_FUNCTIONS)) : r"\1.default(",
  "sgMail.setApiKey" : "sgMail.default.setApiKey",
  "sgMail.send" : "sgMail.default.send",
  "return sgMail\n" : "return sgMail.default\n",
  "return await sgMail\n" : "return await sgMail.default\n",
  "gql`" : "gql.default`",
  "gql(`" : "gql.default(`",
  re.compile(r"import \* as (.*?) from '(%s)'" % "|".join(NAMESPACE_TO_DEFAULT_IMPORTS)) : r"import \1 from '\2'",
  "__dirname": "path.dirname(url.fileURLToPath(import.meta.url))",
  "__filename": "url.fileURLToPath(import.meta.url)",
}

def real_path_of_import(filename, path):
  path = path.replace(CORD_SDK_PACKAGE, CORD_SDK_PATH)
  if path.startswith("./") or path.startswith("../"):
    path = os.path.join(os.path.dirname(filename), path)
  return path

def resolve_import(filename, path):
  if path.startswith(CORD_SDK_PACKAGE):
    if path.count("/") == 1:
      return None

  if os.path.isfile(real_path_of_import(filename, path)):
    return None

  candidates = [
    path + ".ts",
    path + ".tsx",
    path + "/index.ts",
    path + "/index.tsx",
    path + ".js",
    path + ".d.ts",
  ]

  for candidate in candidates:
    if os.path.isfile(real_path_of_import(filename, candidate)):
      return candidate

  print("Could not resolve import: %s" % path)
  return None

def process_line(filename, orig_line, compatible):
  line = orig_line

  if not compatible:
    for a, b in BASIC_REPLACEMENTS.items():
      if isinstance(a, str):
        line = line.replace(a, b)
      else:
        line = a.sub(b, line)

  m = IMPORT_RE.search(line)
  if m:
    resolved_import = resolve_import(filename, m.group(1))
    if resolved_import:
      line = IMPORT_RE.sub("from '%s'" % resolved_import, line)

  if line == orig_line:
    return None
  else:
    return line

def process_file(filename, compatible):
  with open(filename, "r") as f:
    changed = False
    lines = f.readlines()
    for i in range(len(lines)):
      new_line = process_line(filename, lines[i], compatible)
      if new_line != None:
        lines[i] = new_line
        changed = True
  if changed:
    with open(filename, "w") as f:
      f.write("".join(lines))

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('files', type=str, nargs='*')
  parser.add_argument('--compatible', action='store_true')
  args = parser.parse_args()

  if len(args.files):
    for filename in args.files:
      process_file(filename, args.compatible)
  else:
    for dir in DIRS:
      for root, _, files in os.walk(dir):
        for filename in files:
          if filename.endswith(".ts") or filename.endswith(".tsx"):
            path = os.path.join(root, filename)
            process_file(path, args.compatible)

main()

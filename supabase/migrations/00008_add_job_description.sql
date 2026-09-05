-- Migration 00008: add description column to jobs table
alter table jobs add column if not exists description text;

# School-directory source review

## World Bank Data Catalog

URL: https://datacatalog.worldbank.org/search/dataset/0038039/kenya-schools

The page states that the Kenya Schools dataset comprises primary and secondary school locations, was provided by the Kenya Ministry of Education, is public, and is licensed under Creative Commons Attribution 4.0. The metadata page says it was last updated on 20 January 2023. It links to a JSON download and a shapefile ZIP. Because the source is not a current NEMIS export, records require validation before being marked active in SyncSenta.

## Humanitarian Data Exchange

URL: https://data.humdata.org/dataset/kenya-schools

The page describes a public list of primary, secondary, and tertiary schools, with source listed as Kenya Ministry of Education (2010), contributor American Red Cross (inactive), census methodology, and CC BY licensing. The page reports a resource modified on 26 August 2026, but its stated data period is 12 February 2010. The linked resource is a Google Sheet. The current date of the mirror does not make the underlying school records current; it must not be treated as a verified 2026 register without school-level confirmation.

## Kenya Ministry of Education NEMIS

URL: https://www.education.go.ke/nemis

The official Ministry page describes NEMIS as the web-based system that collects school and learner information and assigns a unique learner identifier. It links to the NEMIS application but does not provide an openly downloadable current school-register file on the page.

## Kenya Ministry of Education downloads

URL: https://www.education.go.ke/downloads

The official downloads page contains policy documents, reports, and selected programme lists, but the reviewed page does not provide a current general school-directory download suitable for direct import.

## Decision for SyncSenta

The public datasets can be used as candidate reference data with attribution and provenance, but their age and coverage prevent automatic activation as the production student directory. Active school records should require confirmation by a real school operator or an authoritative current register. No student identities, learner identifiers, passwords, or synthetic schools should be imported.

import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Hirenza CMS")
    .items([
      S.documentTypeListItem("home").title("Home"),
      S.documentTypeListItem("pro").title("Pro"),
      S.documentTypeListItem("partner").title("Partner"),
      S.documentTypeListItem("footer").title("Footer"),
      S.documentTypeListItem("proRegister").title("Pro Register/Signup"),
      S.documentTypeListItem("partnerRegister").title(
        "Partner Register/Signup"
      ),
      S.documentTypeListItem("proLogin").title("Pro Login"),
      S.documentTypeListItem("partnerLogin").title("Partner Login"),
      S.documentTypeListItem("environment").title("Environment"),
      S.documentTypeListItem("resourcePages").title("Resource Pages"),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() &&
          ![
            "home",
            "pro",
            "partner",
            "proRegister",
            "partnerRegister",
            "proLogin",
            "partnerLogin",
            "environment",
            "resourcePages",
            "footer",
          ].includes(item.getId()!)
      ),
    ]);

/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Search from ".";

export default {
  title: "Pages/Search",
  component: Search,
} as ComponentMeta<typeof Search>;

export const DefaultWithBrand = (
  (() => (
    <MemoryRouter initialEntries={["/search/americanas"]}>
      <Routes>
        <Route path="/search" element={<Search />}>
          <Route path=":term" element={<Search />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Search>
).bind({});

export const DefaultNoBrand = (
  (() => (
    <MemoryRouter initialEntries={["/search"]}>
      <Routes>
        <Route path="/search" element={<Search />}>
          <Route path=":term" element={<Search />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Search>
).bind({});

export const DefaultNoResults = (
  (() => (
    <MemoryRouter initialEntries={["/search"]}>
      <Routes>
        <Route path="/search" element={<Search />}>
          <Route path=":term" element={<Search />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Search>
).bind({});

export const Default = (
  (() => (
    <MemoryRouter initialEntries={["/search/mockNotFoundTerm"]}>
      <Routes>
        <Route path="/search" element={<Search />}>
          <Route path=":term" element={<Search />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Search>
).bind({});

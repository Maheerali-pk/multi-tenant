import { SearchIcon } from "lucide-react";

interface SearchProps {
  onChange: (value: string) => void;
  value: string;
}

const Search: React.FC<SearchProps> = ({ onChange, value }) => {
  return (
    <div className="rounded-full b-white border-border-main border p-2.5">
      <div className="flex items-center gap-2.5">
        <SearchIcon
          height={16}
          width={16}
          className="text-border-main"
        ></SearchIcon>
        <input
          type="text"
          placeholder="Search"
          className="outline-none text-text-primary border-none bg-transparent placeholder:text-border-main text-sm w-80"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Search;

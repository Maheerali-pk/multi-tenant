import { SearchIcon } from "lucide-react";

interface SearchProps {
  onChange: (value: string) => void;
  value: string;
}

const Search: React.FC<SearchProps> = ({ onChange, value }) => {
  return (
    <div className="rounded-lg border-border-main border p-1.5 w-64">
      <div className="flex items-center gap-2">
        <SearchIcon
          height={14}
          width={14}
          className="text-border-main"
        ></SearchIcon>
        <input
          type="text"
          placeholder="Search"
          className="outline-none text-text-primary border-none bg-transparent placeholder:text-border-main text-sm w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Search;
